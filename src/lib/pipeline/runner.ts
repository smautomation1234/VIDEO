import { ASSET_BUCKET, GOOGLE_LOCATION, OMNI_MODEL, TEXT_MODEL } from "@/lib/env";
import { googleAccessToken } from "@/lib/google-auth";
import { createReelPlan } from "@/lib/planner";
import {
  classifyProviderError,
  ProviderHttpError,
} from "@/lib/provider-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimJob, event, getClip, getProject, getTake, presenterAsset, updateJob, updateProject } from "@/lib/repository";
import type { ClipTake, GenerationJob, Project } from "@/lib/types";

type DB = ReturnType<typeof createAdminClient>;

export async function dispatchOneJob() {
  const db = createAdminClient();
  await db.rpc("quarantine_stale_submissions", { stale_after_seconds: 900 });
  const job = await claimJob(db);
  if (!job) return { ran: false };
  try {
    if (job.kind === "prompt_plan") await runPromptJob(db, job);
    else if (job.external_response_id) await pollOmniJob(db, job);
    else await submitOmniJob(db, job);
    return { ran: true, jobId: job.id, kind: job.kind };
  } catch (error) {
    await handleError(db, job, error);
    return { ran: true, jobId: job.id, error: message(error) };
  }
}

async function runPromptJob(db: DB, job: GenerationJob) {
  const project = await getProject(db, job.project_id);
  const startedAt = job.started_at || new Date().toISOString();
  await updateJob(db, job.id, { started_at: startedAt });
  await event(db, job.id, "info", `Generating fact-checked script and Omni prompts with ${TEXT_MODEL}.`, { model: TEXT_MODEL, web_search: true });
  const result = await createReelPlan(project);
  await updateProject(db, project.id, { prompt_plan: result, state: "review" });
  await updateJob(db, job.id, {
    status: "completed",
    result,
    error_count: 0,
    completed_at: new Date().toISOString(),
    error_category: null,
    error_code: null,
    error_details: {},
    locked_until: null
  });
  await event(db, job.id, "info", "Prompt plan is ready for human approval.", { clips: result.clips.length });
}

async function submitOmniJob(db: DB, job: GenerationJob) {
  const takeId = String(job.payload.take_id || "");
  const take = await getTake(db, takeId);
  const clip = await getClip(db, take.clip_id);
  const project = await getProject(db, job.project_id);
  const presenter = await presenterAsset(db, project.id);
  const isEditMode = project.mode === "edit_video" && Boolean(clip.source_chunk_path);
  if (!isEditMode && !presenter) throw new Error("Presenter image is missing.");
  
  let imageBytes: Buffer | undefined;
  if (presenter) {
    const { data: image, error } = await db.storage.from(ASSET_BUCKET).download(presenter.storage_path);
    if (error || !image) throw new Error(`Could not load presenter image: ${error?.message || "missing"}`);
    imageBytes = Buffer.from(await image.arrayBuffer());
  }

  let requestBody: ReturnType<typeof omniRequest> | ReturnType<typeof omniEditRequest>;

  if (isEditMode) {
    // Download the source video chunk
    const chunkPath = clip.source_chunk_path!;
    const { data: videoBlob, error: videoError } = await db.storage.from(ASSET_BUCKET).download(chunkPath);
    if (videoError || !videoBlob) throw new Error(`Could not load source video chunk: ${videoError?.message || "missing"}`);
    const videoBytes = Buffer.from(await videoBlob.arrayBuffer());

    const startedAt = job.started_at || new Date().toISOString();
    await updateJob(db, job.id, {
      status: "submitting",
      started_at: startedAt,
      locked_until: null,
    });
    await db
      .from("clip_takes")
      .update({ status: "submitting", started_at: take.started_at || startedAt })
      .eq("id", take.id);
    await event(db, job.id, "info", `[Edit Mode] Submitting Clip ${clip.clip_number}, Take ${take.take_number} with source video.`, { duration: clip.duration_seconds, aspect_ratio: project.aspect_ratio, resolution: project.resolution, edit_mode: true });

    requestBody = omniEditRequest(clip.prompt, videoBytes.toString("base64"));
  } else {
    const startedAt = job.started_at || new Date().toISOString();
    await updateJob(db, job.id, {
      status: "submitting",
      started_at: startedAt,
      locked_until: null,
    });
    await db
      .from("clip_takes")
      .update({ status: "submitting", started_at: take.started_at || startedAt })
      .eq("id", take.id);
    await event(db, job.id, "info", `Submitting Clip ${clip.clip_number}, Take ${take.take_number} with the presenter image attached.`, { duration: clip.duration_seconds, aspect_ratio: project.aspect_ratio, resolution: project.resolution });

    requestBody = omniRequest(project, clip.prompt, presenter!.content_type, imageBytes!.toString("base64"));
  }

  const token = await googleAccessToken();
  const providerHeaders = { authorization: `Bearer ${token}` };
  const url = omniInteractionUrl();
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { ...providerHeaders, "content-type": "application/json" },
      body: JSON.stringify(requestBody)
    });
  } catch (error) {
    throw new AmbiguousProviderError(`Connection ended while submitting to Omni: ${message(error)}`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ProviderHttpError(
      response.status,
      providerMessage(body) || `Omni submission failed with HTTP ${response.status}.`
    );
  }
  const interactionId = String(body.id || body.name || "").replace(/^interactions\//, "");
  if (!interactionId) throw new Error("Google accepted the request but returned no interaction ID.");
  await db.from("clip_takes").update({ provider_interaction_id: interactionId, provider_payload: redact(body), status: normalize(body.status) === "completed" ? "processing" : "waiting_external" }).eq("id", take.id);
  if (normalize(body.status) === "completed") await finishOmni(db, job, take, project, body, providerHeaders);
  else {
    await updateJob(db, job.id, {
      status: "waiting_external",
      external_response_id: interactionId,
      error_count: 0,
      run_after: new Date(Date.now() + 15000).toISOString(),
      locked_until: null
    });
    await event(db, job.id, "info", "Google is generating in the background; the worker will poll it.", { interaction_id: interactionId, provider: "vertex", model: OMNI_MODEL });
  }
}

async function pollOmniJob(db: DB, job: GenerationJob) {
  const take = await getTake(db, String(job.payload.take_id));
  const project = await getProject(db, job.project_id);
  const token = await googleAccessToken();
  const providerHeaders = { authorization: `Bearer ${token}` };
  const url = omniInteractionUrl(job.external_response_id!);
  const response = await fetch(url, { headers: providerHeaders });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ProviderHttpError(
      response.status,
      providerMessage(body) || `Omni polling failed with HTTP ${response.status}.`
    );
  }
  const status = normalize(body.status);
  if (status === "in_progress") {
    await db
      .from("clip_takes")
      .update({
        status: "waiting_external",
        last_error: null,
        error_category: null,
        error_code: null,
        error_details: {},
      })
      .eq("id", take.id);
    await updateJob(db, job.id, {
      status: "waiting_external",
      error_count: 0,
      run_after: new Date(Date.now() + 15000).toISOString(),
      locked_until: null
    });
    return;
  }
  // Store the final payload regardless of success/failure
  await db.from("clip_takes").update({ provider_payload: redact(body) }).eq("id", take.id);
  if (status !== "completed") throw new Error(`Omni interaction ended with status ${body.status || "unknown"}.`);
  await finishOmni(db, job, take, project, body, providerHeaders);
}

async function finishOmni(
  db: DB,
  job: GenerationJob,
  take: ClipTake,
  project: Project,
  body: unknown,
  providerHeaders: Record<string, string>
) {
  const media = findVideo(body);
  if (!media) throw new Error("Omni completed but no video payload or URI was found.");
  const video = media.data ? Buffer.from(media.data, "base64") : await downloadVideo(media.uri!, providerHeaders);
  const path = `${project.user_id}/${project.id}/clip-${take.clip_id}-take-${take.take_number}-${crypto.randomUUID()}.mp4`;
  const { error } = await db.storage.from(ASSET_BUCKET).upload(path, video, { contentType: "video/mp4", upsert: false });
  if (error) throw new Error(`Video was generated but storage failed: ${error.message}`);
  const completedAt = new Date().toISOString();
  await db.from("clip_takes").update({
    status: "completed",
    storage_path: path,
    provider_payload: redact(body),
    last_error: null,
    completed_at: completedAt,
    error_category: null,
    error_code: null,
    error_details: {},
  }).eq("id", take.id);
  const activationWarning = await activateCompletedRetryIfNeeded(
    db,
    take,
    project
  );
  await updateJob(db, job.id, {
    status: "completed",
    result: { storage_path: path },
    error_count: 0,
    completed_at: completedAt,
    error_category: null,
    error_code: null,
    error_details: {},
    locked_until: null
  });
  if (activationWarning) {
    await event(db, job.id, "warning", activationWarning, {
      clip_id: take.clip_id,
      take_id: take.id,
    });
  }
  const [pendingResult, failedResult] = await Promise.all([
    db
      .from("clip_takes")
      .select("id")
      .eq("project_id", project.id)
      .in("status", [
        "queued",
        "processing",
        "submitting",
        "waiting_external",
        "retryable",
      ])
      .limit(1),
    db
      .from("clip_takes")
      .select("id")
      .eq("project_id", project.id)
      .in("status", ["failed", "uncertain"])
      .limit(1),
  ]);
  await updateProject(db, project.id, {
    state: pendingResult.data?.length
      ? "generating"
      : failedResult.data?.length
      ? "attention"
      : "ready",
  });
  await event(db, job.id, "info", `Take ${take.take_number} completed and was stored.`, { storage_path: path });
}

/**
 * A failed first attempt may still be marked selected. When a later attempt
 * completes, promote it only if the clip has no other playable selected take,
 * then repair timeline rows that still point at failed or media-less takes.
 * This is best-effort so a successfully stored video is never marked failed
 * merely because the selection repair encountered a transient database error.
 */
async function activateCompletedRetryIfNeeded(
  db: DB,
  take: ClipTake,
  project: Project
): Promise<string | null> {
  try {
    const { data: selectedPlayable, error: selectedError } = await db
      .from("clip_takes")
      .select("id")
      .eq("clip_id", take.clip_id)
      .eq("selected", true)
      .eq("status", "completed")
      .not("storage_path", "is", null)
      .limit(1)
      .maybeSingle();
    if (selectedError) throw selectedError;
    if (selectedPlayable) return null;

    const { error: selectError } = await db.rpc("select_clip_take", {
      p_take_id: take.id,
      p_user_id: project.user_id,
    });
    if (selectError) throw selectError;

    const { data: clipTakes, error: takesError } = await db
      .from("clip_takes")
      .select("id,status,storage_path")
      .eq("clip_id", take.clip_id);
    if (takesError) throw takesError;

    const invalidTakeIds = (clipTakes || [])
      .filter(
        (candidate) =>
          candidate.id !== take.id &&
          (candidate.status !== "completed" || !candidate.storage_path)
      )
      .map((candidate) => candidate.id);

    if (invalidTakeIds.length) {
      const { error: repairError } = await db
        .from("timeline_items")
        .update({ take_id: take.id })
        .eq("clip_id", take.clip_id)
        .in("take_id", invalidTakeIds);
      if (repairError) throw repairError;
    }

    const { error: nullRepairError } = await db
      .from("timeline_items")
      .update({ take_id: take.id })
      .eq("clip_id", take.clip_id)
      .is("take_id", null);
    if (nullRepairError) throw nullRepairError;
    return null;
  } catch (error) {
    return `Video was stored, but automatic take selection needs retry: ${message(error)}`;
  }
}

function omniRequest(project: Project, prompt: string, mime: string, data: string) {
  const locked = `${prompt}\n\nTECHNICAL OUTPUT LOCK: exactly ${project.aspect_ratio}, ${project.resolution}, no alternate aspect ratio. Generate video with synchronized spoken audio.`;
  return {
    background: true,
    store: true,
    model: OMNI_MODEL,
    input: [
      {
        type: "text",
        text: locked
      },
      {
        type: "image",
        data,
        mime_type: mime
      }
    ],
    generation_config: {
      video_config: {
        task: "image_to_video"
      }
    },
    response_format: {
      type: "video",
      aspect_ratio: project.aspect_ratio
    }
  };
}

function omniEditRequest(prompt: string, videoData: string) {
  return {
    background: true,
    store: true,
    model: OMNI_MODEL,
    input: [
      {
        type: "text",
        text: prompt
      },
      {
        type: "video",
        data: videoData,
        mime_type: "video/mp4"
      }
    ],
    generation_config: {
      video_config: {
        task: "edit"
      }
    },
    response_format: {
      type: "video"
    }
  };
}

function findVideo(value: unknown): { data?: string; uri?: string } | null {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findVideo(child);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;

  const steps = value.steps;
  if (Array.isArray(steps)) {
    const modelStep = steps.find(
      (step) => isRecord(step) && step.type === "model_output"
    );
    if (isRecord(modelStep) && Array.isArray(modelStep.content)) {
      const videoItem = modelStep.content.find(
        (item) =>
          isRecord(item) &&
          item.type === "video" &&
          (typeof item.data === "string" || typeof item.uri === "string")
      );
      if (isRecord(videoItem)) return mediaReference(videoItem);
    }
  }

  if (value.type === "user_input") return null;

  if (value.type === "video") {
    const direct = mediaReference(value);
    if (direct) return direct;
  }
  if (isRecord(value.video)) {
    const nested = mediaReference(value.video);
    if (nested) return nested;
  }
  for (const child of Object.values(value)) {
    const found = findVideo(child);
    if (found) return found;
  }
  return null;
}

async function downloadVideo(uri: string, providerHeaders: Record<string, string>) {
  let url = uri;
  if (uri.startsWith("gs://")) {
    const [bucket, ...parts] = uri.slice(5).split("/");
    url = `https://storage.googleapis.com/download/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(parts.join("/"))}?alt=media`;
  }
  const response = await fetch(url, { headers: providerHeaders });
  if (!response.ok) throw new Error(`Could not download generated video (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

function omniInteractionUrl(interactionId?: string) {
  const suffix = interactionId ? `/${encodeURIComponent(interactionId)}` : "";
  return `https://aiplatform.googleapis.com/v1beta1/projects/${encodeURIComponent(process.env.GOOGLE_CLOUD_PROJECT!)}/locations/${encodeURIComponent(GOOGLE_LOCATION)}/interactions${suffix}`;
}

function redact(body: unknown): unknown {
  return JSON.parse(
    JSON.stringify(body, (key: string, value: unknown) =>
      key === "data" && typeof value === "string" && value.length > 1000
        ? `[base64 omitted: ${value.length} chars]`
        : value
    )
  ) as unknown;
}

function normalize(status: unknown) {
  return String(status || "in_progress").toLowerCase();
}

async function handleError(db: DB, job: GenerationJob, error: unknown) {
  const classified = classifyProviderError(error);
  const text = classified.technicalMessage;
  const nextErrorCount = Number(job.error_count || 0) + 1;
  const retry =
    !(error instanceof AmbiguousProviderError) &&
    classified.retryable &&
    nextErrorCount < job.max_attempts;
  const status = retry ? "retryable" : error instanceof AmbiguousProviderError ? "uncertain" : "failed";
  const userMessage =
    classified.category === "quota" && !retry
      ? "Google rejected every retry because this project has no available Omni generation quota. Check the configured provider, billing tier, or request a quota increase before retrying."
      : classified.userMessage;
  const errorDetails = {
    user_message: userMessage,
    technical_message: classified.technicalMessage,
    support_codes: classified.supportCodes,
    retryable: classified.retryable,
  };
  await updateJob(db, job.id, {
    status,
    error_count: nextErrorCount,
    last_error: text,
    error_category: classified.category,
    error_code: classified.code,
    error_details: errorDetails,
    locked_until: null,
    run_after: new Date(
      Date.now() + Math.min(120000, 5000 * 2 ** Math.max(0, nextErrorCount - 1))
    ).toISOString()
  });
  if (job.payload.take_id) {
    await db.from("clip_takes").update({
      status,
      last_error: text,
      error_category: classified.category,
      error_code: classified.code,
      error_details: errorDetails,
    }).eq("id", String(job.payload.take_id));
  }
  if (!retry) await updateProject(db, job.project_id, { state: "attention" });
  await event(
    db,
    job.id,
    status === "retryable" ? "warning" : "error",
    text,
    {
      category: classified.category,
      code: classified.code,
      support_codes: classified.supportCodes,
      user_message: userMessage,
    }
  );
}

class AmbiguousProviderError extends Error {
  override name = "AmbiguousProviderError";
}
function message(error: unknown) { return error instanceof Error ? error.message : String(error); }

function providerMessage(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return "";
  const messageValue = (error as { message?: unknown }).message;
  return typeof messageValue === "string" ? messageValue : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mediaReference(value: Record<string, unknown>) {
  const data = typeof value.data === "string" ? value.data : undefined;
  const uri = typeof value.uri === "string" ? value.uri : undefined;
  return data || uri ? { data, uri } : null;
}

// ONNX model loader and inference engine for MODNet portrait matting
// Runs entirely in the browser via ONNX Runtime Web
// Must be used in a "use client" component (browser only)

import { InferenceSession, Tensor } from "onnxruntime-web";

const MODEL_URL = "/models/modnet.onnx";

let session: InferenceSession | null = null;
let modelLoaded = false;

// Load ONNX model (called once, cached)
export async function loadModel(
  progressCallback?: (percent: number) => void
): Promise<void> {
  if (modelLoaded && session) return;

  const response = await fetch(MODEL_URL);
  const contentLength =
    Number(response.headers.get("content-length")) || 24.6 * 1024 * 1024;
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (progressCallback) {
      progressCallback(Math.round((received / contentLength) * 100));
    }
  }

  const modelData = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    modelData.set(chunk, offset);
    offset += chunk.length;
  }

  session = await InferenceSession.create(modelData, {
    executionProviders: ["wasm"],
  });
  modelLoaded = true;
}

// Preprocess image: resize + normalize to [0,1] + reshape to NCHW
function preprocess(
  imageData: ImageData,
  targetSize = 512
): { data: Float32Array; originalWidth: number; originalHeight: number } {
  const { width, height, data } = imageData;

  // Resize to targetSize x targetSize
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.putImageData(imageData, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(tmpCanvas, 0, 0, targetSize, targetSize);
  const resized = ctx.getImageData(0, 0, targetSize, targetSize);

  // Convert to NCHW float32 [0,1] — model expects RGB
  const floatData = new Float32Array(1 * 3 * targetSize * targetSize);
  for (let i = 0; i < targetSize * targetSize; i++) {
    floatData[i] = resized.data[i * 4 + 0] / 255.0; // R
    floatData[i + targetSize * targetSize] = resized.data[i * 4 + 1] / 255.0; // G
    floatData[i + 2 * targetSize * targetSize] = resized.data[i * 4 + 2] / 255.0; // B
  }

  return { data: floatData, originalWidth: width, originalHeight: height };
}

// Run inference
export async function runInference(
  imageData: ImageData,
  onProgress?: (stage: string, percent: number) => void
): Promise<Float32Array> {
  if (!session) throw new Error("Model not loaded");

  if (onProgress) onProgress("preprocess", 0);
  const { data, originalWidth, originalHeight } = preprocess(imageData);
  if (onProgress) onProgress("inference", 0);

  const inputTensor = new Float32Array(data.length);
  inputTensor.set(data);

  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]] = new Tensor(
    "float32",
    inputTensor,
    [1, 3, 512, 512]
  );

  const output = await session.run(feeds);
  const outputTensor = output[session.outputNames[0]].data as Float32Array;

  if (onProgress) onProgress("postprocess", 100);
  return outputTensor;
}

// Postprocess: resize mask to original size + apply to image
export function applyMatting(
  maskData: Float32Array,
  imageData: ImageData,
  background: string // hex color
): ImageData {
  // Create 512x512 mask canvas
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 512;
  maskCanvas.height = 512;
  const maskCtx = maskCanvas.getContext("2d")!;
  const maskImageData = maskCtx.createImageData(512, 512);

  for (let i = 0; i < 512 * 512; i++) {
    const v = Math.min(255, Math.max(0, Math.round(maskData[i] * 255)));
    maskImageData.data[i * 4 + 0] = v;
    maskImageData.data[i * 4 + 1] = v;
    maskImageData.data[i * 4 + 2] = v;
    maskImageData.data[i * 4 + 3] = 255;
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  // Resize mask to original size
  const resizedMaskCanvas = document.createElement("canvas");
  resizedMaskCanvas.width = imageData.width;
  resizedMaskCanvas.height = imageData.height;
  const rCtx = resizedMaskCanvas.getContext("2d")!;
  rCtx.drawImage(maskCanvas, 0, 0, imageData.width, imageData.height);
  const resizedMask = rCtx.getImageData(0, 0, imageData.width, imageData.height);

  // Parse background color
  const bgR = parseInt(background.slice(1, 3), 16);
  const bgG = parseInt(background.slice(3, 5), 16);
  const bgB = parseInt(background.slice(5, 7), 16);

  // Composite: result = mask * foreground + (1-mask) * background
  const result = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < imageData.width * imageData.height; i++) {
    const alpha = resizedMask.data[i * 4] / 255.0;
    result.data[i * 4 + 0] = Math.round(
      alpha * imageData.data[i * 4 + 0] + (1 - alpha) * bgR
    );
    result.data[i * 4 + 1] = Math.round(
      alpha * imageData.data[i * 4 + 1] + (1 - alpha) * bgG
    );
    result.data[i * 4 + 2] = Math.round(
      alpha * imageData.data[i * 4 + 2] + (1 - alpha) * bgB
    );
    result.data[i * 4 + 3] = 255;
  }

  return result;
}

// Resize image to target size (for ID photo cropping)
export function resizeToTarget(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const tmp = document.createElement("canvas");
  tmp.width = imageData.width;
  tmp.height = imageData.height;
  tmp.getContext("2d")!.putImageData(imageData, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(tmp, 0, 0, targetWidth, targetHeight);
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

export type IDPhotoSize = {
  name: string;
  width: number;
  height: number;
};

export const ID_PHOTO_SIZES: IDPhotoSize[] = [
  { name: "1寸", width: 295, height: 413 },
  { name: "2寸", width: 413, height: 579 },
  { name: "护照照片", width: 330, height: 453 },
  { name: "美国签证", width: 600, height: 600 },
  { name: "公务员", width: 295, height: 413 },
  { name: "自定义", width: 295, height: 413 },
];

export const BG_COLORS: { name: string; value: string }[] = [
  { name: "白色", value: "#ffffff" },
  { name: "蓝色", value: "#438edb" },
  { name: "红色", value: "#d9001b" },
  { name: "渐变蓝", value: "#1a73e8" },
];

"use client";

import type { FC } from "react";
import { ResizeSettings } from "./resize";
import { CropSettings } from "./crop";
import { CompressSettings } from "./compress";
import { ConvertSettings } from "./convert";
import { RotateSettings } from "./rotate";
import { BorderSettings } from "./border";
import { ColorPaletteSettings } from "./color-palette";
import { WatermarkSettings } from "./watermark";
import { ColorAdjustSettings } from "./color-adjust";
import { PassportPhotoSettings } from "./passport-photo";
import { MemeSettings } from "./meme";
import { BeautifySettings } from "./beautify";
import { OneClickSettings } from "./one-click";

export interface SettingsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

/** Maps tool id -> settings component. Tools not listed here use OneClickSettings. */
export const settingsComponents: Record<string, FC<SettingsProps>> = {
  "image-resize": ResizeSettings,
  "image-crop": CropSettings,
  "image-compress": CompressSettings,
  "image-convert": ConvertSettings,
  "image-rotate": RotateSettings,
  "image-color-palette": ColorPaletteSettings,
  "image-border": BorderSettings,
  "image-watermark": WatermarkSettings,
  "image-color-adjust": ColorAdjustSettings,
  "image-passport-photo": PassportPhotoSettings,
  "image-generate-memes": MemeSettings,
  "image-beautify-screenshots": BeautifySettings,
  // image-favicon, image-strip-metadata, image-info → OneClickSettings (default)
};

export { OneClickSettings };

import { RaycastImage } from "./types";
import fs from "fs";
import fetch from "node-fetch";

/**
 * Get Image from web.
 * @param {string} url
 * @returns {RaycastImage}
 */
export async function GetImageFromUrl(url: string): Promise<RaycastImage | undefined> {
  if (!url.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|png)/g)) throw new Error("Only PNG and JPG are supported");

  const image = await fetch(url)
    .then((res) => {
      return res.arrayBuffer();
    })
    .then((buffer) => {
      return {
        path: url,
        base64: Buffer.from(buffer).toString("base64"),
      } as RaycastImage;
    });

  return image;
}

/**
 * Get Image from disk.
 * @param {string} file
 * @returns {RaycastImage}
 */
export async function GetImageFromFile(file: string) {
  if (!file.match(/(file:)([/|.|\w|\s|-])*\.(?:jpg|png)/g)) throw new Error("Only PNG and JPG are supported");

  file = file.replace("file://", "");

  const blob = fs.readFileSync(file);
  const base64 = Buffer.from(blob).toString("base64");

  return {
    path: file,
    base64: base64,
  } as RaycastImage;
}

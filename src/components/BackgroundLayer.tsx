"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBackgroundImage,
  subscribeBackground,
} from "@/lib/backgroundStore";

export default function BackgroundLayer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const apply = useCallback(async () => {
    const blob = await getBackgroundImage();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (blob) {
      objectUrlRef.current = URL.createObjectURL(blob);
      setImageUrl(objectUrlRef.current);
    } else {
      setImageUrl(null);
    }
  }, []);

  useEffect(() => {
    apply();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [apply]);

  useEffect(() => subscribeBackground(apply), [apply]);

  if (!imageUrl) return null;

  return (
    <div
      className="custom-background"
      style={{ backgroundImage: `url("${imageUrl}")` }}
      aria-hidden="true"
    />
  );
}
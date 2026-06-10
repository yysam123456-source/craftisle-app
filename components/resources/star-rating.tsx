"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  resourceId: string;
  /** 当前平均评分（0-5，0 表示暂无）*/
  averageRating?: number;
  /** 总评分人数 */
  totalRatings?: number;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: 14,
  md: 18,
  lg: 24,
};

/**
 * 读取 localStorage 中的用户评分
 * key = `rating:${resourceId}`
 */
function loadLocalRating(resourceId: string): number {
  try {
    return Number(localStorage.getItem(`rating:${resourceId}`)) || 0;
  } catch {
    return 0;
  }
}

/**
 * 保存用户评分到 localStorage
 */
function saveLocalRating(resourceId: string, rating: number) {
  try {
    localStorage.setItem(`rating:${resourceId}`, String(rating));
  } catch { /* silent */ }
}

export default function StarRating({
  resourceId,
  averageRating = 0,
  totalRatings = 0,
  size = "md",
}: StarRatingProps) {
  const starSize = SIZE_MAP[size];
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(() =>
    loadLocalRating(resourceId),
  );
  const [submitted, setSubmitted] = useState(false);

  // 从 localStorage 初始化
  useEffect(() => {
    setUserRating(loadLocalRating(resourceId));
  }, [resourceId]);

  const handleClick = useCallback(
    (rating: number) => {
      saveLocalRating(resourceId, rating);
      setUserRating(rating);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    },
    [resourceId],
  );

  // 当前展示的评分：hover > user > average
  const displayRating = hoverRating || userRating || averageRating;

  return (
    <div className="flex items-center gap-1.5">
      {/* 星星 */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 rounded hover:bg-yellow-50 transition-colors cursor-pointer bg-transparent border-none"
              title={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                size={starSize}
                className={
                  isFilled
                    ? "fill-yellow-400 text-yellow-500"
                    : "text-gray-300"
                }
              />
            </button>
          );
        })}
      </div>

      {/* 评分文字 */}
      <span className="text-xs text-gray-500 min-w-[60px]">
        {submitted ? (
          <span className="text-green-600">Thanks!</span>
        ) : userRating ? (
          `Your rating: ${userRating}★`
        ) : averageRating > 0 ? (
          `${averageRating.toFixed(1)}★ (${totalRatings})`
        ) : (
          "Rate it"
        )}
      </span>
    </div>
  );
}

export interface Post {
  _id: string;
  _raw: any;
  type: "Post";
  title: string;
  date: string;
  description?: string;
  slug: string;
  image: string | null;
  body: any;
  readingTime?: number;
  [key: string]: any;
}

export interface Doc {
  _id: string;
  title: string;
  slug: string;
  [key: string]: any;
}

export interface Guide {
  _id: string;
  title: string;
  slug: string;
  [key: string]: any;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  [key: string]: any;
}

export const allPosts: Post[] = [];
export const allDocs: Doc[] = [];
export const allGuides: Guide[] = [];
export const allPages: Page[] = [];

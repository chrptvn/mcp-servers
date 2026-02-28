// Forem (dev.to) API entity types

export interface ArticleUser {
  name: string;
  username: string;
  twitter_username: string | null;
  github_username: string | null;
  user_id: number;
  website_url: string | null;
  profile_image: string;
  profile_image_90: string;
}

export interface ArticleOrganization {
  name: string;
  username: string;
  slug: string;
  profile_image: string;
  profile_image_90: string;
}

export interface Article {
  type_of: string;
  id: number;
  title: string;
  description: string;
  readable_publish_date: string;
  slug: string;
  path: string;
  url: string;
  comments_count: number;
  public_reactions_count: number;
  collection_id: number | null;
  published_timestamp: string;
  positive_reactions_count: number;
  cover_image: string | null;
  social_image: string;
  canonical_url: string;
  created_at: string;
  edited_at: string | null;
  crossposted_at: string | null;
  published_at: string;
  last_comment_at: string;
  reading_time_minutes: number;
  tag_list: string[];
  tags: string;
  body_html?: string;
  body_markdown?: string;
  user: ArticleUser;
  organization?: ArticleOrganization;
}

export interface Comment {
  type_of: string;
  id_code: string;
  created_at: string;
  body_html: string;
  user: ArticleUser;
  children?: Comment[];
}

export interface User {
  type_of: string;
  id: number;
  username: string;
  name: string;
  summary: string | null;
  twitter_username: string | null;
  github_username: string | null;
  website_url: string | null;
  location: string | null;
  joined_at: string;
  profile_image: string;
}

export interface Organization {
  type_of: string;
  username: string;
  name: string;
  summary: string;
  twitter_username: string;
  github_username: string;
  url: string;
  location: string;
  tech_stack: string;
  tag_line: string | null;
  story: string | null;
  joined_at: string;
  profile_image: string;
}

export interface Tag {
  id: number;
  name: string;
  bg_color_hex: string | null;
  text_color_hex: string | null;
}

export interface FollowedTag {
  id: number;
  name: string;
  points: number;
}

export interface Follower {
  type_of: string;
  id: number;
  created_at: string;
  name: string;
  path: string;
  username: string;
  profile_image: string;
}

export interface PodcastEpisode {
  type_of: string;
  id: number;
  class_name: string;
  title: string;
  path: string;
  image_url: string;
  podcast: {
    title: string;
    slug: string;
    image_url: string;
  };
}

export interface ProfileImage {
  type_of: string;
  image_of: string;
  profile_image: string;
  profile_image_90: string;
}

export interface Reaction {
  result: string;
  category: string;
  id: number | null;
  reactable_id: number;
  reactable_type: string;
}

export interface ReadingListItem {
  type_of: string;
  id: number;
  status: string;
  article: Article;
}

export interface Page {
  title: string;
  slug: string;
  description: string;
  body_markdown: string | null;
  body_json: string | null;
  is_top_level_path: boolean;
  template: string;
}

export interface DisplayAd {
  id: number;
  name: string;
  body_markdown: string;
  approved: boolean;
  published: boolean;
  placement_area: string;
  tag_list: string | null;
  type_of: string;
}

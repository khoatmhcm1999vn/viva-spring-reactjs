# Product

**Vivacon** is a social networking web application (Instagram-style) with a Spring Boot REST/WebSocket backend and a React single-page frontend.

## Core features

- **Accounts & auth** — registration with email verification tokens, JWT login with refresh tokens, password reset, device/login-activity tracking (user agent parsing + MaxMind GeoLite2 geolocation).
- **Posts** — image posts with captions, hashtags, privacy levels, soft delete. Attachments are uploaded to Cloudinary / AWS S3.
- **Social graph** — follow/unfollow, newsfeed, friend recommendation (mutual-friend scoring), trending posts and top hashtags.
- **Engagement** — likes, nested comments (first-level + child comments), emoji support.
- **Realtime** — STOMP-over-WebSocket chat (conversations, participants, typing indicators, read status) and push notifications.
- **Moderation** — users report accounts, posts, and comments; admins review and approve/reject. Frontend also screens uploaded images via the SightEngine API.
- **Admin dashboard** — account management plus statistics (post/account counts over months/quarters/years, top interactions, user geolocation map), backed by PostgreSQL stored procedures.
- **i18n** — English and Vietnamese via `react-i18next`.

## Roles

`USER`, `ADMIN`, `SUPER_ADMIN`. The frontend reads roles out of the JWT and routes admins to the dashboard, regular users to the newsfeed.

## Status

This is an academic/portfolio project. Config files contain committed credentials (DB passwords, AWS keys, email passwords, API keys) and the `prod` Maven profile points at a frontend directory that no longer exists. Treat these as known issues; do not add new secrets to tracked files.

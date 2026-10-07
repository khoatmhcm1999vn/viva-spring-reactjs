---
inclusion: always
---

# Git isolation — Vivacon và Coffee Shop trong cùng repository

Mục tiêu: sửa, build, test và deploy từng app độc lập; không làm thay đổi source, runtime hoặc dữ liệu của app kia. Áp dụng khi thao tác Git/project/build/deploy trong repository liên quan; không chạy lệnh chỉ vì steering được nạp. Đây là quy ước cho agent, không thay branch protection, quyền truy cập hoặc CI enforcement.

## 1. Ngữ cảnh và nguồn xác nhận

- Repository người dùng cung cấp: `https://github.com/khoatmhcm1999vn/viva-spring-reactjs`.
- Ảnh tại thời điểm yêu cầu có các branch `main`, `feature/ai-assisted-dev-setup`, `feature/coffee-shop-boilerplate`. `feature/1vivacon` là tên ví dụ trong yêu cầu, chưa xác nhận tồn tại; không tự tạo/đổi branch theo tên này.
- Người dùng mô tả Vivacon dùng Spring và Coffee Shop dùng Node.js/React. Ảnh nhánh coffee cho thấy `coffee-shop/` đồng thời có `src/`, `frontend/`, Maven wrapper và root Docker/Compose files của project gốc.
- Chưa đọc được source trực tiếp qua web khi viết steering. Mapping dưới là baseline cần kiểm tra tại checkout; không khẳng định branch, manifest hoặc deploy config hiện tại đã được xác minh.

| App ID | Stack theo ngữ cảnh | Scope dự kiến — cần xác minh | Branch/base |
|---|---|---|---|
| vivacon | Spring/Java; frontend React nếu manifest xác nhận | `src/`, `.mvn/`, `mvnw*`, `pom.xml`, `frontend/`, app-specific deploy config | `main` là default trong ảnh; xác minh base làm việc/release |
| coffee-shop | Node.js + React | `coffee-shop/**`; đọc manifest để tìm backend/frontend thật | `feature/coffee-shop-boilerplate` trong ảnh; chưa mặc định đây là production branch |

Tên directory/repository không đủ chứng minh app hoặc branch ownership. Không đổi directory, tách repo, tạo orphan branch hoặc áp dụng monorepo mới nếu không được yêu cầu.

## 2. Chọn đúng app trước khi sửa

- Xác định app mục tiêu từ yêu cầu và context; đối chiếu working directory, Git root, current branch, upstream, worktrees và trạng thái staged/unstaged/untracked trước mutation.
- Nếu app chưa rõ, đọc các manifest/config cần thiết rồi hỏi một câu chỉ khi ambiguity chặn sửa/deploy. Không lấy current branch làm bằng chứng duy nhất về app mục tiêu.
- Nhánh coffee vẫn chứa Vivacon: sự hiện diện `pom.xml`/`src/` không cho phép sửa hoặc build Vivacon trong task Coffee Shop. Root `package.json`, nếu có, cũng không mặc định thuộc Coffee Shop.
- Áp dụng steering theo app. `product.md`, `tech.md`, `structure.md`, deployment docs cấp root có thể thuộc Vivacon; không ép Spring/Maven hoặc quy tắc frontend Vivacon sang Node/React Coffee Shop.
- Nếu cần bổ sung app steering, đặt scope rõ bằng fileMatch/manual hoặc tài liệu theo app. Chỉ giữ nguyên tắc chung như Git/data safety và version policy ở always; không rewrite tài liệu Vivacon thành Coffee Shop.
- Ghi ngắn khi bắt đầu thay đổi: app, branch/base, app root và files/deploy target dự kiến. Các bước read-only có thể tiếp tục trong lúc thiếu thông tin mutation.

## 3. Branch và local workspace isolation

- Ưu tiên checkout/worktree phù hợp đã có. Khi làm đồng thời hai app, dùng hai worktrees hoặc hai checkout độc lập và mở Kiro workspace riêng; không chuyển branch trong thư mục đang chạy dev server/build/deploy của app khác.
- Worktree tách working files/index nhưng vẫn dùng chung Git repository metadata và không tự tách Docker, ports, databases, global tooling hoặc secrets. Không thay global Git config/Node/Java để giải quyết một app nếu có thể cấu hình theo project.
- Giữ thay đổi người dùng. Không tự stash, reset --hard, clean -fd/-fdx, force checkout, xóa branch/worktree hoặc bỏ file để chuyển branch. Với dirty checkout, làm phần độc lập hoặc tạo vùng làm việc phù hợp khi được phép.
- Base branch của task phải thuộc app mục tiêu và được xác minh. Task Coffee Shop thường bắt đầu từ coffee base đã chọn; không mặc định tạo từ `main` nếu điều đó bỏ mất source coffee chưa merge.
- Nếu cần tạo task branch và đã được yêu cầu, đề xuất convention `feature/vivacon/<task>` hoặc `feature/coffee-shop/<task>`; dùng tên người dùng chỉ định khi có. Convention này không đổi các branch hiện hữu.
- Không merge/rebase toàn bộ nhánh coffee vào Vivacon hoặc ngược lại chỉ để đồng bộ. Kiểm tra ancestry/diff trước khi chọn base hoặc đồng bộ; `ahead N commits` không chứng minh an toàn merge.
- Chia sẻ thay đổi chung bằng commit nhỏ có scope và kiểm tra dependencies trước khi cherry-pick. Không tự cherry-pick app-specific code, secrets hoặc deployment config của app kia.
- Commit, push, PR, merge và deploy chỉ thực hiện trong phạm vi yêu cầu. Không force-push hoặc rewrite shared history để giải quyết isolation.

## 4. Diff, commit và pull request

- Stage từng path đã review; tránh `git add .` khi checkout có thay đổi của nhiều app. Review staged diff và untracked files để ngăn mang theo env, artifacts hoặc thay đổi ngoài task.
- Commit theo app: ví dụ `feat(coffee-shop): ...`, `fix(vivacon): ...`; shared tooling/docs có commit riêng khi thực sự cần. Không tạo commit giả chỉ để đổi scope.
- PR target phải đúng base của app; không mặc định `main`. So sánh toàn diff với base đó, không chỉ commit cuối. Nếu PR coffee -> main mang thêm app coffee vào baseline Vivacon, đó là thay đổi cấu trúc có chủ đích cần được yêu cầu, không tự merge.
- Root/shared files như `.github/workflows/`, `.gitignore`, root Compose, CI scripts và steering có thể ảnh hưởng hai app. Trước khi sửa, liệt kê consumers; cô lập cấu hình theo app nếu cần, không ghi đè shared file âm thầm.
- Không xóa source Vivacon khỏi nhánh coffee chỉ để diagram/tree trông sạch. Chỉ tái cấu trúc khi task yêu cầu và đã phân tích ảnh hưởng.

## 5. Build và version isolation

- Xác định build root, manifest/lockfile, Java/Node runtime, package manager và commands riêng của mỗi app từ source. Chạy với working directory rõ; không cài dependencies từ root theo thói quen.
- Không dùng lockfile, node_modules, build output, Maven config hoặc env của app này làm đầu vào app kia. Cache phải có namespace app + runtime + lockfile/build fingerprint phù hợp.
- Dockerfile/build context phải bao phủ đúng app và shared inputs thật sự cần. Nếu Coffee Shop dùng root context, kiểm tra COPY và `.dockerignore` không vô tình kéo toàn Vivacon/secrets; không mặc định mọi app đều cần root context.
- Không nâng stack app kia để build app mục tiêu. Áp dụng `tech-stack-version-policy.md` trong scope app đang sửa.
- Release artifact/image có namespace app và commit SHA hoặc version riêng; không dùng chung mutable tag `latest` cho hai app. Lưu mapping app -> branch/ref -> SHA -> artifact -> environment.

## 6. Deployment độc lập — bắt buộc kiểm tra ngoài Git

- Tách build/deploy pipeline và target theo app. Branch là bộ chọn source, không phải security boundary hoặc bảo đảm runtime isolation.
- CI dùng branch allowlist và app path filters phù hợp; tính cả manifest, Dockerfile, workflow và shared inputs ảnh hưởng app. Khi cùng có branch/path filters cho push/PR, GitHub yêu cầu cả hai thỏa mãn; pull_request branch filter xét base branch, không phải head branch.
- workflow_dispatch, tags, schedule và workflow_call cần guard riêng theo event/ref/app; không giả định path filters của push bảo vệ manual deployment. Job deploy phải kiểm tra app/ref/target trước mutation; không deploy từ untrusted PR/fork hoặc workflow có secret không phù hợp.
- Tách GitHub environments, secret names, registry repositories/image names, deploy directories và concurrency groups theo app/environment. Không để deployment app này cancel hoặc ghi đè deployment app kia.
- Docker Compose: chỉ định project name riêng, ví dụ `vivacon-dev` và `coffee-shop-dev`; tên thực tế tùy môi trường. Đọc Compose file đúng app và project directory rõ để tránh auto-load root override của Vivacon.
- Không dùng chung explicit container_name, host ports, volume/network `name:` hoặc external resources ngoài chủ đích được mô tả. Compose project name không tự tách các resource có tên cố định/external; kiểm tra rendered config, không chỉ file tên khác.
- Chọn host ports không trùng nếu cùng máy. Networks/database credentials/database names hoặc schema và storage tách theo app; không chạy coffee migrations vào DB Vivacon. Database shared server chỉ khi accounts/data boundaries được thiết kế rõ; không gọi đó là tách server.
- Secrets và `.env` riêng theo app/environment, không commit giá trị thật; root .env không được tự áp vào cả hai app. Không in rendered config có secrets vào log/report.
- Nếu dùng Vercel hoặc dịch vụ tương tự: tạo project/deploy target riêng, root directory/build commands/env/domain riêng; kiểm tra production branch và preview triggers. Không relink `.vercel` của Vivacon thành coffee; branch riêng không ngăn provider auto-build app kia nếu cấu hình trigger chưa tách.
- Stop/restart/down/cleanup phải nhắm đúng app/project/service; không dùng thao tác toàn host hoặc prune/down -v để sửa lỗi. Kiểm tra app kia vẫn hoạt động sau thao tác liên quan môi trường dùng chung.
- Rollback theo artifact và config của đúng app. Không reset toàn repository hoặc restore database của app kia; đổi schema cần kế hoạch tương thích dữ liệu riêng.

## 7. Kiểm chứng và báo cáo

- Trước commit/release, kiểm tra diff nằm trong app scope hoặc shared changes đã giải thích; branch/base và deploy ref đúng. Chạy build/tests liên quan app, không build cả repo mặc định.
- Với thay đổi shared config, chạy kiểm tra hai consumers phù hợp. Nếu không có môi trường app kia, ghi giới hạn; không khẳng định “không ảnh hưởng” chỉ vì diff nhỏ.
- Khi được phép deploy, kiểm tra target/project, image SHA, ports/network/storage, readiness, app -> DB và smoke test. Ghi app/ref/SHA/environment và kết quả; container running chưa chứng minh app healthy.
- Trình bày ngắn: app + branch, files thay đổi, tests, deploy target và phần chưa kiểm chứng. Không tự cập nhật GitHub settings/remote branches/hạ tầng khi chỉ được yêu cầu viết steering.

## Nguồn đối chiếu

Ảnh người dùng là nguồn branch/path tại thời điểm chụp; repository live chưa truy xuất được khi tạo file. Quy tắc phương pháp đối chiếu 08/10/2026:

- Git worktrees: https://git-scm.com/docs/git-worktree
- GitHub workflow syntax/events: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Docker Compose project names: https://docs.docker.com/compose/how-tos/project-name/
- Vercel monorepos/root directory: https://vercel.com/docs/monorepos
- Vercel Git deployments: https://vercel.com/docs/git

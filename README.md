# What If animation: a free skill for Claude Code and OpenCode

Type one line, "What if you could rewind 10 seconds?", and get a finished 15-25 second animated episode in the
dusk-lit stick-figure style of the "What If" channels that took off on YouTube in October 2026.

Every frame is drawn in code: the AI writes the scenes as SVG and Remotion renders them. The voice and the sound
effects come from ElevenLabs. No image model, no video model, no drawing. It runs in Claude Code, or for free in
OpenCode with a free model. Made by [FreshStack](https://freshstack.ai).

## What it does

1. **Writes the script** on the seven-beat What If formula (decoded from five scripts across four channels): a cold
   open of quick demos, the premise as a title card, the fun, and a turn built on one real, checked fact.
2. **Voices it** with ElevenLabs, with word timings, and tightens the pauses to the genre's pace.
3. **Lays out a shot list** on the words, at the genre's pace (about 27 cuts a minute in the opening and up).
4. **Renders a storyboard** of one still per shot, before any animation.
5. **Checks its own stills** against an 11-point checklist and fixes what reads wrong.
6. **Animates** an original cast on one rig, in rooms drawn in real perspective, lit by their own lamps and windows.
7. **Generates and syncs the sound:** an effect on every action, lined up by its attack, ambience per place, a
   music bed, levels set against the voice.
8. **Masters** the episode to -14 LUFS and reports what it cost.

Why the character never changes: it isn't generated, it's a rig in code. The same function draws Pip in every
shot, so there is nothing to drift.

## What you need

- [Claude Code](https://claude.com/claude-code), or [OpenCode](https://opencode.ai) with a free model (see
  [Use it in OpenCode](#use-it-in-opencode-with-a-free-model))
- Node 18 or newer, ffmpeg (with ffprobe), Python 3.9+ with `numpy` and `Pillow`
- An [ElevenLabs](https://elevenlabs.io) API key in your environment or a `.env` file as `ELEVENLABS_API_KEY`.
  The copy-paste episode cost 152 credits: 78 for the voice and 74 for 12 new sound effects. It reused 9 clips from
  the starter library that ships in `studio/library/sfx/`, and every clip you generate joins it for the next
  episode. Later runs cost 170 to 242 credits. ElevenLabs' free plan (10,000 credits a month when we checked, in
  October 2026) covers about 40 episodes, but it's for non-commercial use and asks you to credit ElevenLabs, so
  check its terms before you monetise.

## Install in Claude Code

Clone it into your skills folder, then set up the studio once:

```bash
git clone https://github.com/kelano86/what-if-animation ~/.claude/skills/what-if-animation
cp -r ~/.claude/skills/what-if-animation/studio ./what-if-studio
cd what-if-studio && npm install
```

Then, in Claude Code, from that folder:

> Make a What If episode: what if you could pause everyone but you?

Claude follows `SKILL.md`: script, voice, shot list, storyboard (you'll see it before anything is animated), self-
check, animation, sound, master. You get `out/<slug>/<slug>-final.mp4` and `out/<slug>/storyboard.jpg`.

To see the examples first: `npx remotion studio src/index.ts` and open `Rewind` (the proof clip: three demos, each
undone by playing the shot backwards) or `CopyPaste` (the skill's first full run). Both render straight away.

## Use it in OpenCode, with a free model

[OpenCode](https://opencode.ai) is a free, open-source coding agent. In October 2026 it offers GLM-5.3-Flash Free at
no cost, for a limited time, with no account or key. With this skill, that model made a full episode from one line:
28 minutes, one render, nothing typed in between, and $0 for the model (the voice and sound still use your
ElevenLabs credits).

1. Install the tools above, then OpenCode: `npm install -g opencode-ai`
2. Make a folder for your episodes, put the skill in it under `.claude/skills/`, and add the `/what-if` command
   (OpenCode doesn't list skills when you type `/`, so the command loads it for you).

   Windows (PowerShell):

   ```powershell
   mkdir what-if; cd what-if
   git clone https://github.com/kelano86/what-if-animation .claude/skills/what-if-animation
   mkdir .opencode/commands
   copy .claude/skills/what-if-animation/opencode/commands/what-if.md .opencode/commands/
   ```

   Mac or Linux:

   ```bash
   mkdir what-if && cd what-if
   git clone https://github.com/kelano86/what-if-animation .claude/skills/what-if-animation
   mkdir -p .opencode/commands && cp .claude/skills/what-if-animation/opencode/commands/what-if.md .opencode/commands/
   ```

   No git? Download the ZIP from GitHub and unzip it into `.claude/skills/` (the folder's name doesn't matter), then
   copy `opencode/commands/what-if.md` from it into `.opencode/commands/`.
3. Put your key in a file called `.env` in the same folder, one line: `ELEVENLABS_API_KEY=your-key`
4. Start OpenCode **from inside that folder**: `cd` into it (on Windows you can right-click the folder and choose
   Open in Terminal), then type `opencode`. Started anywhere else, it won't find the skill or the command.
5. Type `/models`, choose GLM-5.3-Flash Free, and press Ctrl+T until the reasoning level reads high.
6. Type `/what-if What if you could pause everyone but you?` and leave it running. The first run copies the studio
   into `what-if-studio/` and installs it, which adds a few minutes.

Tips for the free model:

- One session per episode. An episode can fill most of its 200K context; start fresh for the next one.
- Search YouTube for your premise yourself. The free model's search can miss episodes that already exist, and the
  skill wants an original title.
- Open the source of the episode's fact (`science` in its `episode.json`) before you post.

## What's in the folder

| Path | What |
|---|---|
| `SKILL.md` | The pipeline the AI follows |
| `references/` | The formula, the measured look and checklists, the building-block catalogue, sound, traps |
| `studio/` | The Remotion project: the engine (rig, sets, light, UI, the episode engine) and two example episodes |
| `scripts/` | voice, plan, stills, board, sfx, mixcheck, motiongrid, master |
| `opencode/commands/what-if.md` | The `/what-if` command for OpenCode |

## The rules it follows

- Original characters only: never a channel's hero, nothing that resembles a famous cartoon character.
- Original stories: the formula is shared, the episodes aren't anyone's.
- It never claims the viral channels are made with Claude or any other tool; nobody has said how they're made.
- Every fact in a script is worked out and sourced before it's voiced.

## Honest limits

- Walk cycles and acting are simple next to a hand-animated channel; the look carries it.
- Painted, textured styles (the ink-and-paper explainers) aren't realistic in pure code; they need an image model.
- It's not one prompt: the storyboard step is where the episode gets good. Look at it.

## Licences

- Fonts load from Google Fonts at render time (Bricolage Grotesque, Fragment Mono, Kalam: SIL Open Font License).
  To use your own title face, put it in `studio/public/fonts/` and set `titleFont` in `src/studio.config.ts`.
- [Remotion](https://www.remotion.dev/license) is free for individuals and for companies of up to three people;
  larger companies need a Remotion company licence.
- Voices and sound effects are generated by your ElevenLabs account under its terms. The example episodes' audio
  and the starter clips in `studio/library/sfx/` were generated on a paid plan.
- The code is free to use, change and share.

## Bản phát triển: Style Lock V1 (tiếng Việt)

Bản fork này có hệ thống **khóa phong cách** dùng chung cho toàn bộ cảnh và storyboard.
Sửa file `studio/style-lock.json` để chọn một trong ba giá trị của `preset`:

| Preset | Ý nghĩa |
|---|---|
| `cinematic-dusk` | Giữ nguyên phong cách hoàng hôn điện ảnh của bản gốc (mặc định) |
| `vibrant-color` | Tăng độ rực rỡ và độ sáng, bỏ hạt phim và viền tối |
| `mono-noir` | Chuyển sang đen trắng tương phản, giữ hạt phim và viền tối |

Để `locked: true`: cả video và các ảnh storyboard sẽ dùng **cùng một preset**, kể cả khi
một episode tự truyền các tùy chỉnh màu nền/hạt phim/viền tối trước đây. Sử dụng `locked: false`
để trở lại cách cấu hình theo từng episode của dự án gốc.

**Giới hạn V1:** Đây là các biến thể hậu kỳ màu sắc, **chưa thay đổi nét vẽ SVG hoặc thiết kế nhân vật**.
Muốn thêm phong cách vẽ thực sự như whiteboard, hoạt hình 2D phẳng hoặc anime cần phát triển bộ
render/rig tương ứng. Bước này không phát sinh phí API.



## Style Manager V2 — giao diện tiếng Việt, miễn phí và chạy tại máy

V2 phát triển tiếp trên nhánh `feature/style-lock-v1`. Một trang web cục bộ cho phép chọn preset,
tạo/sửa/xóa phong cách màu riêng, xem trước **nhân vật thật từ Remotion** và lưu Style Lock cho
tất cả video, storyboard sau đó.

### Chạy trên Windows (PowerShell)

Yêu cầu: Node.js 18+ (khuyến nghị 22), Git và các công cụ mà bản gốc yêu cầu khi làm video.

```powershell
git clone https://github.com/npn160603-hash/what-if-animation-fix.git
cd what-if-animation-fix
git switch feature/style-manager-v2
cd studio
npm ci
npm run styles
```

Mở **http://127.0.0.1:3431** trên cùng máy. Để tắt, nhấn Ctrl+C trong terminal.
Nếu đã clone sẵn, dùng `git fetch origin` rồi `git switch feature/style-manager-v2`.
Trên máy Windows, tường lửa không cần mở cổng ra Internet: server chỉ lắng nghe `127.0.0.1`.

### Cách dùng

1. Chọn preset có sẵn, sau đó **Lưu lựa chọn** để cập nhật `studio/style-lock.json`.
2. Hoặc nhấn **+ Phong cách riêng**, chỉnh độ sáng, bão hòa, tương phản, màu nền,
   đen trắng, sepia, hạt phim và viền tối.
3. Nhấn **Tạo ảnh xem trước**. Công cụ sử dụng Remotion render ảnh `Cast` từ
   chính nhân vật có trong engine, kể cả khi chưa lưu phong cách mới.
4. Nhấn **Lưu phong cách riêng** để ghi vào `studio/style-profiles.json` và kích hoạt.
   Có thể chọn lại, sửa hoặc xóa các phong cách đã lưu.
5. Chạy Remotion Studio bằng lệnh `npm run studio` (ở terminal khác) để xem video và storyboard.

**Chế độ khóa:** Khi bật, preset/profile đã chọn áp dụng cho mọi cảnh và storyboard.
Khi tắt, engine quay về thông số theo từng tập của bản gốc. Nút xem trước khi tắt
khóa hiển thị nhân vật với cấu hình Cast mặc định.

**Giới hạn:** V2 chỉ đổi màu và hiệu ứng hậu kỳ, chưa phải phong cách nét vẽ mới. 
Render ảnh xem trước cần các package Remotion trong `npm ci` và Chromium (Remotion có thể
cần cài lần đầu). Không cần API AI/ElevenLabs để **quản lý phong cách**, nhưng luồng tạo
giọng đọc và hiệu ứng âm thanh của dự án gốc vẫn có thể cần ElevenLabs.

**Dữ liệu:** Hồ sơ và lựa chọn lưu vào các file JSON trên máy, không được upload ra
dịch vụ nào bởi Style Manager. Đây là file Git có thể commit; đừng đặt thông tin riêng
tư trong tên profile nếu định đẩy repository Public.

### Kiểm tra

```powershell
cd studio
npm run typecheck
npm run test:styles
node --check style-manager/app.js
node --check scripts/style-manager.mjs
```


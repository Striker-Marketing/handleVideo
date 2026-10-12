# Script for adding bunny cdn videos into lps

Lazy HLS video player. Videos only load when they get close to the viewport, and hls.js is fetched on demand (only in browsers without native HLS, i.e. not Safari/iOS) — no need to include it yourself.

## How to use

### 1. Add a video tag where you want the video

```
<video id="video1" playsinline style="width: 100%; height:100%; object-fit: cover;"></video>
```

The script sets `preload="none"`, `muted` and `playsinline` itself. For above-the-fold videos, add a `poster`.

### 2. Place code into footer

```
<script src="https://cdn.jsdelivr.net/gh/Striker-Marketing/handleVideo@2/handleVideo.min.js"></script>
<script>
  handleVideo({
    videoSelector: '#video1',
    videoUrl: '',
  })
</script>
```

Call `handleVideo` once per video.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `videoSelector` | string | — | CSS selector for the `<video>` element. |
| `videoUrl` | string | — | HLS (`.m3u8`) URL from Bunny CDN. |
| `eager` | boolean | `false` | For above-the-fold (banner/LCP) videos. Skips the scroll observers and starts the stream after the page `load` event, in an idle slot. |
| `newVideoThumb` | string | — | Thumbnail image URL. When set, the video does **not** autoplay: the thumbnail covers the video, and the stream only loads and plays (with sound) when the user clicks it. |

## Behavior

- **Default (lazy autoplay):** the stream loads when the video is within 200px of the viewport and plays muted once 25% of it is visible. A "Click for sound" overlay unmutes and restarts the video from the beginning.
- **`eager: true`:** same muted autoplay + sound overlay, but starts right after page load instead of on scroll. Give the video a `poster` and preload it in `<head>` so it's the LCP element:

  ```
  <link rel="preload" as="image" href="POSTER_URL" fetchpriority="high">
  ```

- **`newVideoThumb`:** nothing is fetched until the thumbnail is clicked; then the video plays with sound from the start.

## Examples

Banner video:

```
<video id="banner" playsinline poster="POSTER_URL" style="width: 100%; height:100%; object-fit: cover;"></video>

<script>
  handleVideo({ videoSelector: '#banner', videoUrl: 'VIDEO_URL', eager: true })
</script>
```

Click-to-play with thumbnail:

```
<script>
  handleVideo({ videoSelector: '#video2', videoUrl: 'VIDEO_URL', newVideoThumb: 'THUMB_URL' })
</script>
```

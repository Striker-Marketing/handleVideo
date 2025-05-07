# Script for adding bunny cdn videos into lps

## How to use

1. Add a video tag where you want the video

- Ex: 

```
<video id="video1" controls playsinline autoplay muted style="width: 100%; height:100%; object-fit: cover;"></video>
```

## Place code into footer

```
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script src="https://cdn.jsdelivr.net/gh/Striker-Marketing/handleVideo@1/handleVideo.min.js"></script>
<script>
  handleVideo({
    videoSelector: '',
    videoUrl: '',
    isAutoplay: false,
  })
</script>
```
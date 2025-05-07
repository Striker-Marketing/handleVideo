const handleVideo = ({ videoSelector, videoUrl, isAutoplay }) => {
  const video = document.querySelector(videoSelector);
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = videoUrl;
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(videoUrl);
    hls.attachMedia(video);
  }
  if (isAutoplay) {
    const style = document.createElement("style");
    style.innerHTML = ".mute-button-pulse{background-color: white;border-radius:50%;animation:2s infinite pulse-animation}@keyframes pulse-animation{0%{box-shadow:0 0 0 0 rgba(0,0,0,.4)}100%{box-shadow:0 0 0 20px transparent}}";
    document.head.appendChild(style);
    const parent = video.parentElement;
    const unMuteButton = document.createElement("div");
    Object.assign(unMuteButton.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      top: "0",
      left: "0",
      zIndex: "1",
      cursor: "pointer",
    });
    unMuteButton.addEventListener("click", () => {
      video.muted = false;
      unMuteButton.remove();
    });
    const svg = document.createElement("svg");
    unMuteButton.appendChild(svg);
    parent.appendChild(unMuteButton);
    svg.outerHTML =
      '<svg class="mute-button-pulse" xmlns="http://www.w3.org/2000/svg" width="70px" height="70px" viewBox="0 -960 960 960" width="24px" fill="black"><path d="M640-440v-80h160v80H640Zm48 280-128-96 48-64 128 96-48 64Zm-80-480-48-64 128-96 48 64-128 96ZM120-360v-240h160l200-200v640L280-360H120Zm280-246-86 86H200v80h114l86 86v-252ZM300-480Z"/></svg>';
    svg.classList.add("mute-button-pulse");
  }
};

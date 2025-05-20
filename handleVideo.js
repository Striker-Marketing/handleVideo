const handleVideo = ({ videoSelector, videoUrl, isAutoplay, playerColor }) => {
  const video = document.querySelector(videoSelector);
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = videoUrl;
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(videoUrl);
    hls.attachMedia(video);
  }
  const parent = video.parentElement;
  const button = document.createElement("div");
  Object.assign(button.style, {
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
  const svg = document.createElement("svg");
  button.appendChild(svg);
  parent.appendChild(button);
  if (isAutoplay) {
    const style = document.createElement("style");
    style.innerHTML = ".mute-button-pulse{background-color: white;border-radius:50%;animation:2s infinite pulse-animation}@keyframes pulse-animation{0%{box-shadow:0 0 0 0 rgba(0,0,0,.4)}100%{box-shadow:0 0 0 20px transparent}}";
    document.head.appendChild(style);
    button.addEventListener("click", () => {
      video.muted = false;
      button.remove();
    });
    svg.outerHTML = '<svg class="mute-button-pulse" xmlns="http://www.w3.org/2000/svg" width="70px" height="70px" viewBox="0 -960 960 960" width="24px" fill="black"><path d="M640-440v-80h160v80H640Zm48 280-128-96 48-64 128 96-48 64Zm-80-480-48-64 128-96 48 64-128 96ZM120-360v-240h160l200-200v640L280-360H120Zm280-246-86 86H200v80h114l86 86v-252ZM300-480Z"/></svg>';
    svg.classList.add("mute-button-pulse");
  } else {
    svg.outerHTML = `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="70" height="70" rx="35" fill="${playerColor || "black"}"/><path d="M29.1328 19.504C28.0922 18.8541 26.7844 18.8327 25.7227 19.4398C24.6609 20.0468 24 21.1894 24 22.4321V47.5705C24 48.8131 24.6609 49.9558 25.7227 50.5628C26.7844 51.1699 28.0922 51.1413 29.1328 50.4986L49.3828 37.9293C50.3883 37.308 51 36.2011 51 35.0013C51 33.8015 50.3883 32.7017 49.3828 32.0732L29.1328 19.504Z" fill="white"/></svg>`
    button.addEventListener("click", () => {
      video.play();
      button.remove();
    });
  }
};
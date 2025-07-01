const handleVideo = ({ videoSelector, videoUrl, isAutoplay, playerColor, thumbUrl }) => {
  const handleText = (text) => {
    if (text.style.maxWidth === "0px") {
      text.style.maxWidth = "200px";
      text.style.maxHeight = "20px";
      text.style.paddingLeft = "8px";
    } else {
      text.style.maxWidth = "0px";
      text.style.maxHeight = "0px";
      text.style.paddingLeft = "0px";
      text.style.overflow = "hidden";
    }
  };
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
  parent.appendChild(button);
  if (isAutoplay) {
    const svgWrapper = document.createElement("div");
    const text = document.createElement("span");
    text.innerHTML = "Click for sound";
    text.style.transition = "max-height 0.2s, max-width 0.2s, padding 0.2s";
    text.style.lineHeight = "1";
    handleText(text);
    svgWrapper.appendChild(text);
    svgWrapper.appendChild(svg);
    button.appendChild(svgWrapper);
    Object.assign(svgWrapper.style, {
      width: "fit-content",
      background: "rgba(0, 0, 0, 0.7)",
      borderRadius: "100px",
      padding: "6px",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    button.addEventListener("click", () => {
      video.muted = false;
      button.remove();
    });
    button.addEventListener("mouseenter", () => handleText(text));
    button.addEventListener("mouseleave", () => handleText(text));
    svg.outerHTML =
      '<svg viewBox="0 0 237 237" width="40" height="40"><style>@keyframes waveSmall{0%{opacity:0}33%{opacity:1}66%{opacity:1}100%{opacity:0}}@keyframes waveLarge{0%{opacity:0}33%{opacity:1}66%{opacity:1}100%{opacity:0}}.wave-small{animation:waveSmall 2s infinite;opacity:0}.wave-large{animation:waveLarge 2s infinite 0.3s;opacity:0}</style><path fill="#fff" d="M88 107H65v24h24l23 23V84z"/><g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="10"><path d="M142 86c9 21 9 44 0 65" class="wave-small"/><path d="M165 74c13 23 13 66 0 89" class="wave-large"/></g></svg>';
  } else {
    if (thumbUrl) {
      const image = document.createElement("img");
      image.src = thumbUrl;
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "cover";
      button.appendChild(image);
    } else {
      button.appendChild(svg);
      svg.outerHTML = `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="70" height="70" rx="35" fill="${
        playerColor || "black"
      }"/><path d="M29.1328 19.504C28.0922 18.8541 26.7844 18.8327 25.7227 19.4398C24.6609 20.0468 24 21.1894 24 22.4321V47.5705C24 48.8131 24.6609 49.9558 25.7227 50.5628C26.7844 51.1699 28.0922 51.1413 29.1328 50.4986L49.3828 37.9293C50.3883 37.308 51 36.2011 51 35.0013C51 33.8015 50.3883 32.7017 49.3828 32.0732L29.1328 19.504Z" fill="white"/></svg>`;
    }
    button.addEventListener("click", () => {
      video.play();
      button.remove();
    });
  }
};

/**
 * Lazy HLS video handler.
 *
 * hls.js is fetched from jsDelivr only when BOTH are true:
 *   - the browser has no native HLS support (i.e. not Safari/iOS), and
 *   - a video has scrolled close enough to the viewport to need a stream.
 *
 * Exposes window.handleVideo({ videoSelector, videoUrl }).
 */
(() => {
  const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.7.1/dist/hls.light.min.js';

  // Never fetch a rendition bigger than the player box, and start at the bottom
  // of the ladder instead of probing upward.
  const HLS_CONFIG = {
    capLevelToPlayerSize: true,
    startLevel: 0,
    maxBufferLength: 10,
    maxMaxBufferLength: 30,
    backBufferLength: 10,
    maxBufferSize: 10 * 1000 * 1000,
  };

  const SOUND_ICON =
    '<svg viewBox="0 0 237 237" width="40" height="40"><style>@keyframes waveSmall{0%{opacity:0}33%{opacity:1}66%{opacity:1}100%{opacity:0}}@keyframes waveLarge{0%{opacity:0}33%{opacity:1}66%{opacity:1}100%{opacity:0}}.wave-small{animation:waveSmall 2s infinite;opacity:0}.wave-large{animation:waveLarge 2s infinite 0.3s;opacity:0}</style><path fill="#fff" d="M88 107H65v24h24l23 23V84z"/><g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="10"><path d="M142 86c9 21 9 44 0 65" class="wave-small"/><path d="M165 74c13 23 13 66 0 89" class="wave-large"/></g></svg>';

  const hasNativeHls = (video) => Boolean(video.canPlayType('application/vnd.apple.mpegurl'));

  // One shared injection for all five players.
  let hlsPromise = null;
  const loadHlsLibrary = () => {
    if (hlsPromise) return hlsPromise;
    hlsPromise = new Promise((resolve, reject) => {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      const script = document.createElement('script');
      script.src = HLS_SRC;
      script.async = true;
      script.onload = () => resolve(window.Hls);
      script.onerror = () => reject(new Error('hls.js failed to load'));
      document.head.appendChild(script);
    });
    return hlsPromise;
  };

  const startStream = (video, videoUrl) => {
    if (hasNativeHls(video)) {
      video.src = videoUrl;
      return Promise.resolve();
    }
    return loadHlsLibrary().then((Hls) => {
      if (!Hls || !Hls.isSupported()) return;
      const hls = new Hls(HLS_CONFIG);
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else hls.destroy();
      });
    });
  };

  const toggleLabel = (el) => {
    if (el.style.maxWidth === '0px') {
      el.style.maxWidth = '200px';
      el.style.maxHeight = '20px';
      el.style.paddingLeft = '8px';
    } else {
      el.style.maxWidth = '0px';
      el.style.maxHeight = '0px';
      el.style.paddingLeft = '0px';
      el.style.overflow = 'hidden';
    }
  };

  const buildSoundOverlay = (video, onClick) => {
    const parent = video.parentElement;
    parent.style.position = 'relative';

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '1',
      cursor: 'pointer',
    });
    parent.appendChild(overlay);

    const pill = document.createElement('div');
    Object.assign(pill.style, {
      width: 'fit-content',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '100px',
      padding: '6px',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    const label = document.createElement('span');
    label.innerHTML = 'Click for sound';
    label.style.transition = 'max-height 0.2s, max-width 0.2s, padding 0.2s';
    label.style.lineHeight = '1';
    toggleLabel(label);

    pill.appendChild(label);
    overlay.appendChild(pill);
    pill.insertAdjacentHTML('beforeend', SOUND_ICON);

    overlay.addEventListener('click', () => {
      onClick();
      overlay.remove();
    });
    overlay.addEventListener('mouseenter', () => toggleLabel(label));
    overlay.addEventListener('mouseleave', () => toggleLabel(label));
  };

  const handleVideo = ({ videoSelector, videoUrl }) => {
    const video = document.querySelector(videoSelector);
    if (!video) return;

    video.preload = 'none';

    let started = false;
    const loadStream = () => {
      if (started) return Promise.resolve();
      started = true;
      return startStream(video, videoUrl);
    };

    // Vertical margin only — horizontal neighbours in the carousel must not preload.
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadObserver.disconnect();
        loadStream();
      },
      { rootMargin: '200px 0px' },
    );
    loadObserver.observe(video);

    const playObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        playObserver.disconnect();
        loadStream().then(() => video.play().catch(() => {}));
      },
      { threshold: 0.25 },
    );
    playObserver.observe(video);

    buildSoundOverlay(video, () => {
      loadStream().then(() => {
        video.play();
        video.muted = false;
        video.currentTime = 0;
      });
    });
  };

  window.handleVideo = handleVideo;
})();

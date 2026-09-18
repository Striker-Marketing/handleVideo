/**
 * Lazy HLS video handler.
 *
 * hls.js is fetched from jsDelivr only when BOTH are true:
 *   - the browser has no native HLS support (i.e. not Safari/iOS), and
 *   - a video has scrolled close enough to the viewport to need a stream.
 *
 * Exposes window.handleVideo({ videoSelector, videoUrl, eager }).
 *
 * eager: true is for above-the-fold (banner/LCP) videos. The scroll observers are
 * skipped, but the stream still waits for the load event + an idle slot so hls.js
 * and the manifest never compete with the poster, which is the LCP element.
 * Give eager videos a poster and preload it in <head> with fetchpriority="high".
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

  // cors must match how the origin is later fetched, or the warmed connection is not reused:
  // hls.js pulls the stream with XHR (CORS), while its own <script> tag is no-cors.
  const addPreconnect = (href, cors) => {
    const origin = new URL(href, location.href).origin;
    if (origin === location.origin) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    if (cors) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  // Run after the load event, in an idle slot, so nothing here delays LCP or adds to TBT.
  const whenIdleAfterLoad = (fn) => {
    const idle = () =>
      window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 1);
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
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

  const handleVideo = ({ videoSelector, videoUrl, eager = false }) => {
    const video = document.querySelector(videoSelector);
    if (!video) return;

    video.preload = 'none';

    let started = false;
    const loadStream = () => {
      if (started) return Promise.resolve();
      started = true;
      return startStream(video, videoUrl);
    };

    if (eager) {
      // Autoplay is only allowed muted + inline; the sound overlay unmutes on click.
      video.muted = true;
      video.playsInline = true;
      if (!video.poster) {
        console.warn(`handleVideo: eager video "${videoSelector}" has no poster; LCP will wait on the stream.`);
      }

      // Warm up DNS/TLS now without downloading anything.
      const nativeHls = hasNativeHls(video);
      addPreconnect(videoUrl, !nativeHls);
      if (!nativeHls) addPreconnect(HLS_SRC, false);

      whenIdleAfterLoad(() => loadStream().then(() => video.play().catch(() => {})));
    } else {
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
    }

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

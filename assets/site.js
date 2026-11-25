(function () {
  "use strict";
  var d = document;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // masthead: transparent over the photo, solid once the photo has gone
  var top = d.getElementById("top"), hero = d.getElementById("hero");
  function onScroll() {
    var y = window.scrollY || 0;
    top.classList.toggle("solid", hero ? y > hero.offsetHeight - 90 : y > 120);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // phone menu: one full-screen overlay, closes on link tap or Escape
  var mbtn = d.getElementById("mbtn"), mnav = d.getElementById("mnav");
  if (mbtn && mnav) {
    mbtn.addEventListener("click", function () {
      var open = top.classList.toggle("open");
      mbtn.setAttribute("aria-expanded", open ? "true" : "false");
      mbtn.innerHTML = open ? "<i></i>Close" : "<i></i>Menu";
      d.body.style.overflow = open ? "hidden" : "";
    });
    mnav.addEventListener("click", function (ev) {
      if (ev.target.tagName === "A" && top.classList.contains("open")) mbtn.click();
    });
    d.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && top.classList.contains("open")) mbtn.click();
    });
  }

  // town filter: chips narrow the ranked list without a page load
  var fbar = d.getElementById("filters"), fcount = d.getElementById("fcount");
  if (fbar) {
    var allRows = [].slice.call(d.querySelectorAll(".rows > li.row"));
    fbar.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (!chip) return;
      [].forEach.call(fbar.querySelectorAll(".chip"), function (c) { c.classList.remove("on"); });
      chip.classList.add("on");
      var t = chip.dataset.town || "", shown = 0;
      allRows.forEach(function (r) {
        var hit = !t || (r.dataset.town || "").indexOf(t) > -1;
        r.hidden = !hit;
        if (hit) shown++;
      });
      if (fcount) fcount.textContent = t ? shown + " of " + allRows.length + " serve " + chip.textContent : "";
    });
  }

  // magnetic buttons: the CTA leans toward the cursor
  if (!reduce && window.matchMedia("(hover:hover)").matches) {
    [].forEach.call(d.querySelectorAll(".btn"), function (b) {
      b.addEventListener("mousemove", function (ev) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((ev.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + "px," +
          ((ev.clientY - r.top - r.height / 2) * 0.2).toFixed(1) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  // the hero photograph drifts slower than the page, so the first screen has depth
  var art = d.querySelector(".hero-art");
  if (art && !reduce) {
    var ticking = false;
    function drift() {
      var y = window.scrollY || 0;
      if (y < 1200) {
        art.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
        art.style.opacity = String(Math.max(0, 1 - y / 1100));
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  }

  // entries ease in as they arrive; a short stagger so a run of rows reads as a column filling in
  var rows = [].slice.call(d.querySelectorAll(".rise"));
  if (reduce || !("IntersectionObserver" in window)) {
    rows.forEach(function (r) { r.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = rows.indexOf(en.target);
        en.target.style.transitionDelay = (i % 4) * 70 + "ms";
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    rows.forEach(function (r) { io.observe(r); });
  }

  // the town ticker only animates when it is on screen and the tab is visible
  var track = d.querySelector(".ticker ul");
  if (track) {
    track.innerHTML += track.innerHTML; // seamless: the keyframes travel exactly one copy
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        track.style.animationPlayState = es[0].isIntersecting ? "running" : "paused";
      }).observe(track);
    }
  }

  // lead form: same-origin JSON to the shared kingaisites backend
  var form = d.getElementById("sform");
  if (form) {
    var done = d.getElementById("sdone"), err = d.getElementById("serr"), btn = form.querySelector("button");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      var fd = new FormData(form), body = { slug: form.dataset.slug };
      fd.forEach(function (v, k) { body[k] = String(v).trim(); });
      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch("https://kingaisites.com/api/lead", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.ok) throw new Error(res.j.error || "Something went wrong.");
          form.hidden = true;
          done.classList.add("on");
          done.setAttribute("tabindex", "-1");
          done.focus();
        })
        .catch(function (e) {
          err.textContent = e.message + " You can also write to hello@kingaisites.com.";
          btn.disabled = false;
          btn.textContent = btn.dataset.label;
        });
    });
  }

  // a share button where the browser has one
  var share = d.getElementById("share");
  if (share && navigator.share) {
    share.hidden = false;
    share.addEventListener("click", function () {
      navigator.share({ title: d.title, url: location.href }).catch(function () {});
    });
  }


  // hero counters (byline) — plain increment, no library
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  d.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseInt(el.dataset.count, 10);
    if (reduce || !end || end > 999) return;
    var t0 = 0;
    var tick = function (t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 900);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // section index: scrollspy + smooth anchors
  var idxLinks = [].slice.call(d.querySelectorAll(".idx-a"));
  if (idxLinks.length) {
    var tiers = idxLinks.map(function (a) { return d.getElementById("tier-" + a.dataset.tier); });
    idxLinks.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var t = d.getElementById("tier-" + a.dataset.tier);
        if (!t) return;
        ev.preventDefault();
        t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    });
    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          idxLinks.forEach(function (a) { a.classList.toggle("on", a.dataset.tier === e.target.id.replace("tier-", "")); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      tiers.forEach(function (t) { if (t) spy.observe(t); });
    }
  }

  // method: fill the rail as the list is read
  var mList = d.querySelector(".m-list"), mBar = d.querySelector(".m-prog i"),
      mStep = d.getElementById("mstep"), mItems = [].slice.call(d.querySelectorAll(".m-list li"));
  if (mBar && mItems.length) {
    var paint = function () {
      var r = mList.getBoundingClientRect();
      var k = Math.min(1, Math.max(0, (window.innerHeight * 0.72 - r.top) / Math.max(1, r.height)));
      mBar.style.width = (k * 100).toFixed(1) + "%";
      var on = Math.min(mItems.length, Math.max(1, Math.ceil(k * mItems.length) || 1));
      mItems.forEach(function (li, i) { li.classList.toggle("on", i < on); });
      if (mStep) mStep.textContent = "0" + on + " / 0" + mItems.length;
    };
    paint();
    addEventListener("scroll", paint, { passive: true });
    addEventListener("resize", paint);
  }

  // seasons track progress
  var track = d.querySelector(".seasons"), sBar = d.querySelector(".s-prog i");
  if (track && sBar) {
    var st = function () {
      var w = track.scrollWidth - track.clientWidth;
      var k = w > 0 ? track.scrollLeft / w : 0;
      sBar.style.transform = "translateX(" + (k * (track.clientWidth - sBar.offsetWidth)) + "px)";
    };
    track.addEventListener("scroll", st, { passive: true });
    addEventListener("resize", st);
    st();
  }

  // the printed date in the footer is the build date; keep the year honest if it rolls over
  var yr = d.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---- v5 motion: progress hairline, photo parallax, rank count-up ----
  var sprog = d.querySelector(".sprog"), heroEl = d.getElementById("hero");
  function progress() {
    if (!sprog) return;
    var h = d.documentElement.scrollHeight - window.innerHeight;
    var k = h > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / h)) : 0;
    sprog.style.width = (k * 100).toFixed(2) + "%";
  }

  // photos inside cards and the calendar drift a little slower than the text
  var parallax = [].slice.call(d.querySelectorAll(".card-art img, .season img, .band-row .wide img"));
  function slide() {
    var vh = window.innerHeight;
    parallax.forEach(function (im) {
      var r = im.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      var k = (r.top + r.height / 2 - vh / 2) / vh;   // -1 … 1
      im.style.objectPosition = "50% " + (50 - k * 9).toFixed(1) + "%";
    });
  }

  if (!reduce) {
    var queued = false;
    var onMove = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { progress(); slide(); queued = false; });
    };
    addEventListener("scroll", onMove, { passive: true });
    addEventListener("resize", onMove);
    progress(); slide();
  } else {
    progress();
  }

  // rank numerals tick up once, the way a printed count would settle
  if (!reduce && "IntersectionObserver" in window) {
    var ranks = [].slice.call(d.querySelectorAll(".rank"));
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseInt(el.textContent, 10);
        rio.unobserve(el);
        if (!end || end > 99) return;
        var t0 = 0;
        var step = function (t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 620);
          el.textContent = (k < 1 ? Math.round(end * (1 - Math.pow(1 - k, 3))) : end)
            .toString().padStart(2, "0");
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    ranks.forEach(function (r) { rio.observe(r); });
  }
})();

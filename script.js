"use strict";

function getCurrentTime(currentTime) {
  let seconds = Math.floor(currentTime % 60).toString();
  let minutes = Math.floor((currentTime / 60) % 60).toString();
  let hours = Math.floor(currentTime / 3600).toString();
  seconds.length < 2 ? (seconds = "0" + seconds) : "";
  minutes.length < 2 ? (minutes = "0" + minutes) : "";
  hours.length < 2 ? (hours = "0" + hours) : "";
  return { hours, minutes, seconds };
}

class Player {
  constructor(videoUrl, video, timeCount, timeRange, title, time) {
    this.videoUrl = videoUrl;
    this.video = video;
    this.source = document.querySelector("source");
    this.timeCount = timeCount;
    this.timeRange = timeRange;
    this.qualities = [];
    this.currentQuality = 'Auto';

    // Reset error state
    $("#errorContainer").text("");
    $(".spinner").show();

    if (title != undefined && title.toString() != "null") {
      $("#video_title").text(`${title}`);
    }
    if (
      time != undefined &&
      time.toString() != "null" &&
      !isNaN(time.toString())
    ) {
      this.changeTime(time);
    }

    // Clear previous source and reload
    this.video.pause();
    this.video.currentTime = 0;
    this.source.src = "";
    this.video.load();

    // Set new source
    this.setSource(videoUrl);
  }

  setSource(url) {
    this.videoUrl = url;
    this.source.src = url;
    this.video.load();
    
    // Detect available qualities for Wikimedia videos
    if (url.includes('wikimedia.org')) {
      this.detectWikimediaQualities(url);
    }
    
    handlePlayerError(this.video);
  }

  updateTime() {
    let { hours, minutes, seconds } = getCurrentTime(this.video.currentTime);
    $(this.timeCount).text(hours + ":" + minutes + ":" + seconds);
    $(this.timeRange).css(
      "--current-percentage",
      (this.video.currentTime * 100) / this.video.duration + "%"
    );
  }

  changeTime(newTime) {
    this.video.currentTime = newTime;
    this.updateTime();
  }

  changeSpeed() {
    let currSpeed = $(this.video).attr("speed");
    if (currSpeed >= 2) {
      this.video.playbackRate = this.video.playbackRate = 0.5;
    } else {
      this.video.playbackRate += 0.25;
    }
    $("#currentSpeed").text(this.video.playbackRate);
    $(this.video).attr("speed", this.video.playbackRate);
  }

  playPause() {
    const playPauseIcon = $("#playPause img");
    const centerBtn = $("#center_btn img");
    if (this.video.paused) {
      // playing....
      playPauseIcon.attr("src", "./icons/pause.svg");
      centerBtn.attr("src", "./icons/pause.svg");
      this.animateActionsBtn("pause");
      this.video.play();
    } else {
      // pausing...
      playPauseIcon.attr("src", "./icons/play.svg");
      centerBtn.attr("src", "./icons/play.svg");
      this.animateActionsBtn("play");
      this.video.pause();
    }
  }
  play() {
    const playPauseIcon = $("#playPause img");
    const centerBtn = $("#center_btn img");
    // playing....
    playPauseIcon.attr("src", "./icons/pause.svg");
    centerBtn.attr("src", "./icons/pause.svg");
    this.animateActionsBtn("pause");
    this.video.play();
  }
  pause() {
    const playPauseIcon = $("#playPause img");
    const centerBtn = $("#center_btn img");
    // pausing...
    playPauseIcon.attr("src", "./icons/play.svg");
    centerBtn.attr("src", "./icons/play.svg");
    this.animateActionsBtn("play");
    this.video.pause();
  }

  replay() {
    this.video.currentTime = 0;
    this.updateTime();
  }
  forward() {
    this.video.currentTime += 10;
    this.animateActionsBtn("forward");
    this.updateTime();
  }
  backward() {
    this.video.currentTime -= 10;
    this.animateActionsBtn("backward");
    this.updateTime();
  }

  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  fullScreen() {
    const videoContainer = document.getElementById("video_container");
    let wakeLock = null;
    if (this.isFullscreen()) {
      // exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      screen.orientation.unlock();
      if ("wakeLock" in navigator && wakeLock != null) {
        wakeLock.release("screen");
      }
    } else {
      if (videoContainer.mozRequestFullScreen) {
        videoContainer.mozRequestFullScreen();
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      } else {
        videoContainer.requestFullscreen();
      }
      screen.orientation.lock("landscape");
      if ("wakeLock" in navigator) {
        wakeLock = navigator.wakeLock.request("screen");
      }
    }
  }

  goFullScreen() {
    if (!this.isFullscreen()) {
      this.fullScreen();
    }
  }

  toggleFillScreen() {
    const videoContainer = document.getElementById("video_container");
    if ($(videoContainer).attr("fill") == "true") {
      $(videoContainer).attr("fill", "false");
      $(videoContainer).height("auto");
    } else {
      $(videoContainer).attr("fill", "true");
      $(videoContainer).height(screen.height);
    }
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
    this.animateActionsBtn(this.video.muted ? "mute" : "volume");
    if (this.video.muted) {
      $("#volume").css("--volume", 0);
      $("#volume").val(0);
      $("#toggleMute img").attr("src", "./icons/mute.svg");
    } else {
      $("#volume").css("--volume", 100);
      $("#volume").val(100);
      $("#toggleMute img").attr("src", "./icons/volume.svg");
    }
  }

  volumeUp() {
    this.video.muted = false;
    this.video.volume += 0.1;
    $("#volume").css("--volume", this.video.volume * 100 + "%");
    $("#volume").val(this.video.volume * 100);
    this.animateActionsBtn("volumeUp");
  }
  volumeDown() {
    this.video.muted = false;
    this.video.volume -= 0.1;
    $("#volume").css("--volume", this.video.volume * 100 + "%");
    $("#volume").val(this.video.volume * 100);
    this.animateActionsBtn("volumeDown");
  }
  changeVolume(newVolume) {
    if (newVolume <= 0) {
      $("#toggleMute img").attr("src", "./icons/mute.svg");
      this.animateActionsBtn("mute");
    } else {
      this.video.muted = false;
      $("#toggleMute img").attr("src", "./icons/volume.svg");
    }

    this.video.volume = newVolume / 100;
    $("#volume").val(newVolume);
    $("#volume").css("--volume", newVolume + "%");
  }

  changeAspectRatio() {
    let aspectIndex = Number($(this.video).attr("aspectIndex"));
    aspectIndex >= 3 ? (aspectIndex = 0) : (aspectIndex += 1);
    $(this.video).attr("aspectIndex", aspectIndex);
    switch (aspectIndex) {
      case 0:
        $(this.video).css("aspect-ratio", "auto");
        $("#aspectRatio span").text("Auto");
        popupTimedMsg("Aspect Ratio : Auto", 3000, 300);
        $(this.video).css("max-height", "100vh");
        $(this.video).css("max-width", "100vw");
        $(this.video).width("100vw");
        $(this.video).height("100vh");
        break;
      case 1:
        $(this.video).css("aspect-ratio", "16/9");
        popupTimedMsg("Aspect Ratio : 16 / 9", 3000, 300);
        $("#aspectRatio span").text("16:9");
        break;
      case 2:
        $(this.video).css("aspect-ratio", "auto");
        $(this.video).css("max-height", "none");
        $(this.video).css("max-width", "100vw");
        $(this.video).width(screen.width);
        $(this.video).height("auto");
        $("#aspectRatio span").text("WFill");
        popupTimedMsg("Aspect Ratio : Width fill", 3000, 300);
        break;
      case 3:
        $(this.video).css("aspect-ratio", "auto");
        $(this.video).css("max-height", "100vh");
        $(this.video).css("max-width", "none");
        $(this.video).height(screen.height);
        $(this.video).width("auto");
        $("#aspectRatio span").text("HFill");
        popupTimedMsg("Aspect Ratio : Height fill", 3000, 300);
        break;
    }
  }

  animateActionsBtn(iconName) {
    $("#actions_viewer img").attr("src", `./icons/${iconName}.svg`);
    $("#actions_viewer").fadeTo(150, 0.5).fadeOut(250);
  }

  hideControls(animationDuration) {
    $("#controls").stop(true, false).fadeOut(animationDuration);
    $("#center_btn").stop(true, false).fadeOut(animationDuration);
    $("#dimmBg").stop(true, false).fadeOut(animationDuration);
    $("#video_header").stop(true, false).fadeOut(animationDuration);
  }
  showControls(animationDuration) {
    $("#controls").stop(true, false).fadeIn(animationDuration);
    $("#center_btn").stop(true, false).fadeIn(animationDuration);
    $("#dimmBg").stop(true, false).fadeIn(animationDuration);
    $("#video_header").stop(true, false).fadeIn(animationDuration);
  }
  toggleControls(animationDuration) {
    $("#controls").stop(true, false).fadeToggle(animationDuration);
    $("#center_btn").stop(true, false).fadeToggle(animationDuration);
    $("#dimmBg").stop(true, false).fadeToggle(animationDuration);
    $("#video_header").stop(true, false).fadeToggle(animationDuration);
  }

  toggleQualityMenu() {
    const existingMenu = document.getElementById('qualityMenu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement('div');
    menu.id = 'qualityMenu';
    menu.style.cssText = `
      position: absolute;
      bottom: 60px;
      right: 50px;
      background: rgba(28, 28, 28, 0.9);
      border-radius: 4px;
      padding: 8px 0;
      z-index: 10;
    `;

    // Add Auto quality option
    const autoOption = this.createQualityOption('Auto', this.currentQuality === 'Auto');
    menu.appendChild(autoOption);

    // Add available qualities
    this.qualities.forEach(quality => {
      const option = this.createQualityOption(quality.label, this.currentQuality === quality.label);
      menu.appendChild(option);
    });

    document.getElementById('video_container').appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#qualityMenu') && !e.target.closest('#videoQuality')) {
        menu.remove();
      }
    }, { once: true });
  }

  createQualityOption(label, isActive) {
    const option = document.createElement('div');
    option.style.cssText = `
      padding: 8px 16px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      ${isActive ? 'background: rgba(255, 255, 255, 0.1);' : ''}
    `;
    option.innerHTML = `
      ${isActive ? '<i class="fa-solid fa-check" style="color: #ffffff;"></i>' : ''}
      <span>${label}</span>
    `;
    option.onclick = () => this.changeQuality(label);
    return option;
  }

  changeQuality(quality) {
    const currentTime = this.video.currentTime;
    const isPaused = this.video.paused;
    
    if (quality === 'Auto') {
      // Reset to original source
      this.setSource(this.videoUrl);
    } else {
      // Find the selected quality source
      const selectedQuality = this.qualities.find(q => q.label === quality);
      if (selectedQuality) {
        this.setSource(selectedQuality.url);
      }
    }

    // Update quality indicator
    this.currentQuality = quality;
    document.getElementById('currentQuality').textContent = quality;
    
    // Remove quality menu
    const menu = document.getElementById('qualityMenu');
    if (menu) menu.remove();

    // Restore playback state
    this.video.addEventListener('loadedmetadata', () => {
      this.video.currentTime = currentTime;
      if (!isPaused) this.video.play();
    }, { once: true });
  }

  // Add method to detect Wikimedia video qualities
  async detectWikimediaQualities(url) {
    try {
      // Extract the filename from the URL
      const filename = url.split('/').pop().split('?')[0];
      
      // Fetch video info from Wikimedia API
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?` +
        `action=query&` +
        `titles=File:${filename}&` +
        `prop=videoinfo&` +
        `viprop=derivatives&` +
        `format=json&` +
        `origin=*`
      );

      const data = await response.json();
      const page = Object.values(data.query.pages)[0];
      
      if (page.videoinfo && page.videoinfo[0].derivatives) {
        // Create a Map to store unique qualities based on height
        const qualityMap = new Map();
        
        page.videoinfo[0].derivatives
          .filter(d => d.type.startsWith('video/'))
          .forEach(d => {
            const height = d.height;
            // Only store the first occurrence of each height
            if (!qualityMap.has(height)) {
              qualityMap.set(height, {
                label: `${height}p`,
                url: d.src
              });
            }
          });

        // Convert Map values to array and sort by height (descending)
        this.qualities = Array.from(qualityMap.values())
          .sort((a, b) => parseInt(b.label) - parseInt(a.label));
      }
    } catch (error) {
      console.error('Error detecting video qualities:', error);
    }
  }
}

let player = new Player(
  "",
  document.getElementById("main_vid"),
  document.getElementById("time_value"),
  document.getElementById("time_range")
);

// on document ready
$(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const movieUrl = decodeURI(urlParams.get("url"));
  let time_interval;

  // Initially hide the video container
  $('#video_container').hide();

  if (
    movieUrl != "null" &&
    movieUrl != null &&
    movieUrl.trim() != "" &&
    movieUrl != undefined
  ) {
    // If URL is provided, hide search and show video
    $('#searchContainer').hide();
    $('#video_container').show();
    
    player = new Player(
      movieUrl,
      document.getElementById("main_vid"),
      document.getElementById("time_value"),
      document.getElementById("time_range"),
      decodeURI(urlParams.get("tl")),
      decodeURI(urlParams.get("t"))
    );
    time_interval = setInterval(function () {
      player.updateTime();
    }, 1000);
    player.fullScreen();
  }

  listenToKeyEvents();

  let counter = 0;
  setInterval(() => {
    counter++;
    if (counter > 3) {
      player.hideControls(400);
    }
  }, 1000);

  $("#time_range").on("mousemove", function (e) {
    $(this).css("--indicator-left-pos", e.clientX - 12 + "px");
  });

  $("#time_range").on("input", function () {
    player.changeTime(
      Math.round(($(this).val() * player.video.duration) / 100)
    );
  });
  $("#volume").on("input", function () {
    player.changeVolume($(this).val());
  });

  $(".control_btn").on("click", function () {
    counter = 0;
  });

  $("#volume").on("click input mousemove", function (e) {
    player.showControls(200);
    counter = 0;
  });

  //
  //
  // * Phone features Only
  //
  if (!window.matchMedia("(hover: hover)").matches) {
    $(player.video).on("click", player.showControls(200));

    let startTouchPos = null;
    let timeCurrentPercentage = null;
    let changePercentage = 0;
    $(`#${player.video.id}, #videoLeftSide, #videoRightSide`).on(
      "touchmove",
      function (e) {
        if (startTouchPos == null || timeCurrentPercentage == null) {
          player.pause();
          clearInterval(time_interval);
          startTouchPos = e.touches[0].clientX;
          timeCurrentPercentage = Number(
            $("#time_range").css("--current-percentage").replace("%", "")
          );
        }
        changePercentage =
          ((e.changedTouches[0].clientX - startTouchPos) * 100) / screen.width;
        let newPercentage = timeCurrentPercentage + changePercentage;
        newPercentage >= 100 ? (newPercentage = 100) : "";
        newPercentage <= 0 ? (newPercentage = 0) : "";
        $("#time_range").css(
          "--current-percentage",
          newPercentage.toString() + "%"
        );
        let { hours, minutes, seconds } = getCurrentTime(
          (player.video.duration * newPercentage) / 100
        );
        $(player.timeCount).text(hours + ":" + minutes + ":" + seconds);
        player.showControls(100);
        counter = 0;
      }
    );
    $(`#${player.video.id}, #videoLeftSide, #videoRightSide`).on(
      "touchend",
      function (e) {
        if (changePercentage == null || timeCurrentPercentage == null) {
          return;
        }

        if (changePercentage > 0) {
          player.video.currentTime +=
            (changePercentage * player.video.duration) / 100;
        } else {
          player.video.currentTime -=
            (Math.abs(changePercentage) * player.video.duration) / 100;
        }
        startTouchPos = null;
        timeCurrentPercentage = null;
        player.updateTime();
        time_interval = setInterval(function () {
          player.updateTime();
        }, 1000);
        player.play();
      }
    );

    $("#videoLeftSide").on("dblclick", function () {
      player.backward();
      $(this).css("opacity", 1);
      setTimeout(() => {
        $(this).css("opacity", 0);
      }, 300);
    });

    $("#videoRightSide").on("dblclick", function () {
      player.forward();
      $(this).css("opacity", 1);
      setTimeout(() => {
        $(this).css("opacity", 0);
      }, 300);
    });

    $("#video_container").on("click", function (e) {
      console.log(e.target.tagName);
      if (
        e.target.tagName.toUpperCase() == "IMG" ||
        e.target.tagName.toUpperCase() == "VIDEO" ||
        e.target.tagName.toUpperCase() == "BUTTON" ||
        e.target.tagName.toUpperCase() == "SPAN" ||
        e.target.tagName.toUpperCase() == "INPUT"
      ) {
        player.showControls(200);
        counter = 0;
      } else {
        player.toggleControls(200);
        counter = 0;
      }
    });
  } else {
    //
    //
    // * PC features Only
    //

    $(document).on("mousemove", function () {
      player.showControls(200);
      counter = 0;
    });

    $("#video_container").on("click input mousemove mousedown", function (e) {
      player.showControls(200);
      counter = 0;
    });

    player.video.onclick = () => {
      player.playPause();
      counter = 0;
    };
    player.video.ondblclick = () => {
      player.fullScreen();
    };
  }
});

function listenToKeyEvents() {
  $(document).on("keydown", function (e) {
    switch (e.key.toUpperCase()) {
      case "F11":
        e.preventDefault();
        player.fullScreen();
        break;
      case " ":
      case "K":
        player.playPause();
        break;
      case "M":
        player.toggleMute();
        break;
      case "ARROWRIGHT":
      case "L":
        player.forward();
        break;
      case "ARROWLEFT":
      case "J":
        player.backward();
        break;
      case "ARROWUP":
        player.volumeUp();
        break;
      case "ARROWDOWN":
        player.volumeDown();
        break;
      case "S":
        player.changeSpeed();
        break;
      case "+":
      case "-":
        player.changeAspectRatio();
        break;
    }
  });
}

function handlePlayerError(video) {
  video.onerror = (e) => {
    $(".spinner").hide();
    player.hideControls(100);
    $("#errorContainer").text(`Error: Resource not found or format not supported`);
  };

  video.addEventListener("waiting", (e) => {
    $(".spinner").show();
    $("#errorContainer").text("");
  });

  video.addEventListener("canplay", (e) => {
    $(".spinner").hide();
    $("#errorContainer").text("");
    var promise = video.play();

    if (promise !== undefined) {
      promise
        .then((_) => {
          $(`#playPause img, #center_btn img`).attr("src", "./icons/pause.svg");
        })
        .catch((error) => {
          popupTimedMsg("Auto play is disabled", 3000, 400);
        });
    }

    if (video.buffered.length > 0) {
      $("#bufferingIndicator").css(
        "--buffered-percentage",
        ((video.buffered.end(0) / video.duration) * 100).toString() + "%"
      );
    }
  });

  video.addEventListener("progress", () => {
    if (video.buffered.length > 0) {
      let bufferedPercentage =
        (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
      $("#bufferingIndicator").css(
        "--buffered-percentage",
        bufferedPercentage.toString() + "%"
      );
    }
  });
}

function popupTimedMsg(msg, duration, animationDuration) {
  $("#popup").html(msg);
  $("#popup").css("display", "block");
  $("#popup").stop(true, false).animate({
    top: 16,
    opacity: 1,
  });
  setTimeout(() => {
    $("#popup")
      .stop(true, false)
      .fadeOut(animationDuration, () => {
        $("#popup").css("top", "-1rem");
        $("#popup").css("opacity", "0");
      });
  }, duration);
}

function slideIn(ele, distance) {
  $(ele).css("display", "block");
  $(ele).stop(true, false).animate({
    top: distance,
    opacity: 1,
  });
}

function loadLocalVideo() {
  console.log("changing vid");
  var file = document.getElementById("video_file").files[0];
  var fileURL = window.URL.createObjectURL(file);
  player = new Player(
    fileURL,
    document.getElementById("main_vid"),
    document.getElementById("time_value"),
    document.getElementById("time_range")
  );
  time_interval = setInterval(function () {
    player.updateTime();
  }, 1000);
  player.fullScreen();

  return;
}

async function searchVideos() {
  const searchTerm = document.getElementById('searchInput').value;
  const searchResults = document.getElementById('searchResults');
  searchResults.innerHTML = '<div class="spinner"></div>';
  
  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `format=json&` +
      `generator=search&` +
      `gsrnamespace=6&` +
      `gsrsearch=filetype:video ${searchTerm}&` +
      `gsrlimit=20&` +
      `prop=imageinfo&` +
      `iiprop=url|mediatype|size|mime|thumburl&` +
      `iiurlwidth=250&` +
      `origin=*`
    );

    const data = await response.json();
    searchResults.innerHTML = '';

    if (!data.query || !data.query.pages) {
      searchResults.innerHTML = '<p>No videos found. Try different keywords.</p>';
      return;
    }

    Object.values(data.query.pages)
      .filter(page => {
        const imageInfo = page.imageinfo?.[0];
        return imageInfo && imageInfo.mime?.startsWith('video/');
      })
      .forEach(page => {
        const imageInfo = page.imageinfo[0];
        const thumbnailUrl = imageInfo.thumburl || 
          `https://commons.wikimedia.org/w/thumb.php?width=250&f=${encodeURIComponent(page.title.replace('File:', ''))}`;
        
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
          <div class="thumbnail-container">
            <img src="${thumbnailUrl}" 
                 onerror="this.src='./play.png'" 
                 alt="${page.title}">
          </div>
          <h3>${page.title.replace('File:', '').replace(/\.(webm|ogv|mp4)$/i, '')}</h3>
        `;
        videoItem.onclick = () => playVideo(imageInfo.url, page.title);
        searchResults.appendChild(videoItem);
      });

  } catch (error) {
    console.error('Error searching videos:', error);
    searchResults.innerHTML = '<p>Error searching videos</p>';
  }
}

function playVideo(videoUrl, title) {
  // Hide search container and show video player
  document.getElementById('searchContainer').style.display = 'none';
  document.getElementById('video_container').style.display = 'flex';

  // Clear any existing interval
  if (window.time_interval) {
    clearInterval(window.time_interval);
  }

  // Create new player instance with the selected video
  player = new Player(
    videoUrl,
    document.getElementById("main_vid"),
    document.getElementById("time_value"),
    document.getElementById("time_range"),
    title
  );

  // Start time update interval and store it globally
  window.time_interval = setInterval(function () {
    player.updateTime();
  }, 1000);
}

// Modify the return button click handler
document.getElementById('return').onclick = function() {
    // Show search container and hide video player
    document.getElementById('searchContainer').style.display = 'block';
    document.getElementById('video_container').style.display = 'none';
    
    // Stop the current video and clear its source
    if (player && player.video) {
        player.video.pause();
        player.video.currentTime = 0;
        player.source.src = '';
        player.video.removeAttribute('src'); // Remove src attribute
        player.video.load();
    }

    // Clear error message and spinner
    $("#errorContainer").text("");
    $(".spinner").hide();

    // Clear any existing time update intervals
    if (window.time_interval) {
        clearInterval(window.time_interval);
        window.time_interval = null;
    }
};

// Add this after your existing functions
let debounceTimeout;

document.getElementById('searchInput').addEventListener('input', function(e) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => getSuggestions(e.target.value), 300);
});

async function getSuggestions(query) {
    if (!query || query.length < 2) {
        document.getElementById('searchSuggestions').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://commons.wikimedia.org/w/api.php?` +
            `action=opensearch&` +
            `format=json&` +
            `search=filetype:video ${query}&` +
            `namespace=6&` +
            `limit=10&` +
            `origin=*`
        );

        const [searchTerm, suggestions] = await response.json();
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = suggestion.replace('File:', '');
            div.onclick = () => {
                document.getElementById('searchInput').value = suggestion.replace('File:', '');
                suggestionsContainer.style.display = 'none';
                searchVideos();
            };
            suggestionsContainer.appendChild(div);
        });
        suggestionsContainer.style.display = 'block';

    } catch (error) {
        console.error('Error getting suggestions:', error);
    }
}

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
        document.getElementById('searchSuggestions').style.display = 'none';
    }
});


// JavaScript for theme toggle
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("themeIcon");

  // Toggle between dark and light modes
  if (body.getAttribute("data-theme") === "light") {
    body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark"); // Save the theme preference
    themeIcon.classList.replace("fa-sun", "fa-moon"); // Use moon icon for dark mode
  } else {
    body.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light"); // Save the theme preference
    themeIcon.classList.replace("fa-moon", "fa-sun"); // Use sun icon for light mode
  }
}


// Initialize theme based on saved preference
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark"; // Default to dark mode
  document.body.setAttribute("data-theme", savedTheme);

  // Set the appropriate icon
  const themeIcon = document.getElementById("themeIcon");
  if (savedTheme === "light") {
    themeIcon.classList.replace("fa-moon", "fa-sun");
  }
});

// Attach the toggle function to the button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);



// Add keyboard navigation for suggestions
document.getElementById('searchInput').addEventListener('keydown', function(e) {
    const suggestions = document.getElementById('searchSuggestions');
    const items = suggestions.getElementsByClassName('suggestion-item');
    let currentFocus = -1;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        // Change focus
        if (e.key === 'ArrowDown') {
            currentFocus = currentFocus < items.length - 1 ? currentFocus + 1 : 0;
        } else {
            currentFocus = currentFocus > 0 ? currentFocus - 1 : items.length - 1;
        }

        // Remove active class from all items
        Array.from(items).forEach(item => item.classList.remove('active'));
        
        // Add active class to current item
        if (currentFocus >= 0) {
            items[currentFocus].classList.add('active');
            this.value = items[currentFocus].textContent;
        }
    } else if (e.key === 'Enter') {
        if (suggestions.style.display === 'block') {
            e.preventDefault();
            const activeItem = suggestions.querySelector('.suggestion-item.active');
            if (activeItem) {
                activeItem.click();
            } else {
                searchVideos();
            }
        }
    }
});

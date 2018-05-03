// # ----- Script info:
// - Author: Michael Mammoliti
// - Name: jAudio.js
// - Version: 0.2
// - js dipendencies: jQuery
// - Release date: 25 November 2015
// - GitHub: https://github.com/MichaelMammoliti/jAudio.js

// # ----- Contact info
// - GitHub: https://github.com/MichaelMammoliti
// - Mail: mammoliti.michael@gmail.com
// - Twitter: @MichMammoliti

// # ----- License Info
// - Released under the GPL v3 license.

(function($){

  var pluginName = "jAudio",
      defaults = {
        playlist: [],

        defaultAlbum: undefined,
        defaultArtist: undefined,
        defaultTrack: 0,

        autoPlay: false,

        debug: false
      };

  function Plugin( $context, options )
  {
    this.settings         = $.extend( true, defaults, options );

    this.$context         = $context;

    this.domAudio         = this.$context.find("audio")[0];
    this.$domPlaylist     = this.$context.find(".jAudio--playlist");
    this.$domControls     = this.$context.find(".jAudio--controls");
    this.$domVolumeBar    = this.$context.find(".jAudio--volume");
    this.$domDetails      = this.$context.find(".jAudio--details");
    this.$domStatusBar    = this.$context.find(".jAudio--status-bar");
    this.$domProgressBar  = this.$context.find(".jAudio--progress-bar-wrapper");
    this.$domTime         = this.$context.find(".jAudio--time");
    this.$domElapsedTime  = this.$context.find(".jAudio--time-elapsed");
    this.$domTotalTime    = this.$context.find(".jAudio--time-total");
    this.$domThumb        = this.$context.find(".jAudio--thumb");

    this.currentState       = "pause";
    this.currentTrack       = this.settings.defaultTrack;
    this.currentElapsedTime = undefined;

    this.timer              = undefined;

    this.init();
  }

  Plugin.prototype = {

    init: function()
    {
      var self = this;

      self.renderPlaylist();
      self.preLoadTrack();
      self.highlightTrack();
      self.updateTotalTime();
      self.events();
      self.debug();
      self.domAudio.volume = 0.05
    },

    play: function()
    {
      var self        = this,
          playButton  = self.$domControls.find("#btn-play");

      self.domAudio.play();

      if(self.currentState === "play") return;

      clearInterval(self.timer);
      self.timer = setInterval( self.run.bind(self), 50 );

      self.currentState = "play";

      // change id
      playButton.data("action", "pause");
      playButton.attr("id", "btn-pause");

      // activate
      playButton.toggleClass('active');
    },

    pause: function()
    {
      var self        = this,
          playButton  = self.$domControls.find("#btn-pause");

      self.domAudio.pause();
      clearInterval(self.timer);

      self.currentState = "pause";

      // change id
      playButton.data("action", "play");
      playButton.attr("id", "btn-play");

      // activate
      playButton.toggleClass('active');

    },

    stop: function()
    {
      var self = this;

      self.domAudio.pause();
      self.domAudio.currentTime = 0;

      self.animateProgressBarPosition();
      clearInterval(self.timer);
      self.updateElapsedTime();

      self.currentState = "stop";
    },

    prev: function()
    {
      var self  = this,
          track;

      (self.currentTrack === 0)
        ? track = self.settings.playlist.length - 1
        : track = self.currentTrack - 1;

      self.changeTrack(track);
    },
    next: function()
    {
      var self = this,
          track;

      (self.currentTrack === self.settings.playlist.length - 1)
        ? track = 0
        : track = self.currentTrack + 1;

      self.changeTrack(track);
    },


    preLoadTrack: function()
    {
      var self      = this,
          defTrack  = self.settings.defaultTrack;

      self.changeTrack( defTrack );

      self.stop();
    },

    changeTrack: function(index)
    {
      var self = this;

      self.currentTrack  = index;
      self.domAudio.src  = self.settings.playlist[index].file;

      if(self.currentState === "play" || self.settings.autoPlay) self.play();

      self.highlightTrack();

      self.updateThumb();

      self.renderDetails();
    },

    events: function()
    {
      var self = this;

      // - controls events
      self.$domControls.on("click", "button", function()
      {
        var action = $(this).data("action");

        switch( action )
        {
          case "prev": self.prev.call(self); break;
          case "next": self.next.call(self); break;
          case "pause": self.pause.call(self); break;
          case "stop": self.stop.call(self); break;
          case "play": self.play.call(self); break;
        };

      });

      // - playlist events
      self.$domPlaylist.on("click", ".jAudio--playlist-item", function(e)
      {
        var item = $(this),
            track = item.data("track"),
            index = item.index();

        if(self.currentTrack === index) return;

        self.changeTrack(index);
      });

      // - volume's bar events
      // to do

      // - progress bar events
      self.$domProgressBar.on("click", function(e)
      {
        self.updateProgressBar(e);
        self.updateElapsedTime();
      });

      $(self.domAudio).on("loadedmetadata", function()
      {
        self.animateProgressBarPosition.call(self);
        self.updateElapsedTime.call(self);
        self.updateTotalTime.call(self);
      });
    },


    getAudioSeconds: function(string)
    {
      var self    = this,
          string  = string % 60;
          string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    getAudioMinutes: function(string)
    {
      var self    = this,
          string  = string / 60;
          string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    addZero: function(word, howManyZero)
    {
      var word = String(word);

      while(word.length < howManyZero) word = "0" + word;

      return word;
    },

    removeZero: function(word, howManyZero)
    {
      var word  = String(word),
          i     = 0;

      while(i < howManyZero)
      {
        if(word[0] === "0") { word = word.substr(1, word.length); } else { break; }

        i++;
      }

      return word;
    },


    highlightTrack: function()
    {
      var self      = this,
          tracks    = self.$domPlaylist.children(),
          className = "active";

      tracks.removeClass(className);
      tracks.eq(self.currentTrack).addClass(className);
    },

    renderDetails: function()
    {
      var self          = this,
          track         = self.settings.playlist[self.currentTrack],
          file          = track.file,
          thumb         = track.thumb,
          trackName     = track.trackName,
          trackArtist   = track.trackArtist,
          trackAlbum    = track.trackAlbum,
          template      =  "";

          template += "<p>";
          template += "<span>" + trackName + "</span>";
          // template += " - ";
          template += "<span>" + trackArtist + "</span>";
          // template += "<span>" + trackAlbum + "</span>";
          template += "</p>";


      $(".jAudio--details").html(template);

    },

    renderPlaylist: function()
    {
      var self = this,
          template = "";


      $.each(self.settings.playlist, function(i, a)
      {
        var file          = a["file"],
            thumb         = a["thumb"],
            trackName     = a["trackName"],
            trackArtist   = a["trackArtist"],
            trackAlbum    = a["trackAlbum"];
            trackDuration = "00:00";

        template += "<div class='jAudio--playlist-item' data-track='" + file + "'>";

        template += "<div class='jAudio--playlist-thumb'><img src='"+ thumb +"'></div>";

        template += "<div class='jAudio--playlist-meta-text'>";
        template += "<h4>" + trackName + "</h4>";
        template += "<p>" + trackArtist + "</p>";
        template += "</div>";
        // template += "<div class='jAudio--playlist-track-duration'>" + trackDuration + "</div>";
        template += "</div>";

      // });

      });

      self.$domPlaylist.html(template);

    },

    run: function()
    {
      var self = this;

      self.animateProgressBarPosition();
      self.updateElapsedTime();

      if(self.domAudio.ended) self.next();
    },

    animateProgressBarPosition: function()
    {
      var self        = this,
          percentage  = (self.domAudio.currentTime * 100 / self.domAudio.duration) + "%",
          styles      = { "width": percentage };

      self.$domProgressBar.children().eq(0).css(styles);
    },

    updateProgressBar: function(e)
    {
      var self = this,
          mouseX,
          percentage,
          newTime;

      if(e.offsetX) mouseX = e.offsetX;
      if(mouseX === undefined && e.layerX) mouseX = e.layerX;

      percentage  = mouseX / self.$domProgressBar.width();
      newTime     = self.domAudio.duration * percentage;

      self.domAudio.currentTime = newTime;
      self.animateProgressBarPosition();
    },

    updateElapsedTime: function()
    {
      var self      = this,
          time      = self.domAudio.currentTime,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),

          audioTime = minutes + ":" + seconds;

      self.$domElapsedTime.text( audioTime );
    },

    updateTotalTime: function()
    {
      var self      = this,
          time      = self.domAudio.duration,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),
          audioTime = minutes + ":" + seconds;

      self.$domTotalTime.text( audioTime );
    },


    updateThumb: function()
    {
      var self = this,
          thumb = self.settings.playlist[self.currentTrack].thumb,
          styles = {
            "background-image": "url(" + thumb + ")"
          };

      self.$domThumb.css(styles);
    },

    debug: function()
    {
      var self = this;

      if(self.settings.debug) console.log(self.settings);
    }

  }

  $.fn[pluginName] = function( options )
  {
    var instantiate = function()
    {
      return new Plugin( $(this), options );
    }

    $(this).each(instantiate);
  }

})(jQuery)

var t = {
  playlist: [
    {
      file: "resources/mp3/01.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第1课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/02.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第2课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/03.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第3课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/04.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第4课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/05.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第5课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/06.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第6课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/07.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第7课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
        {
      file: "resources/mp3/08.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第8课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/09.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第9课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/10.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第10课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/11.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第11课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/12.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第12课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/13.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第13课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/14.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第14课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/15.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第15课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/16.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第16课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/17.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第17课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/18.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第18课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/19.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第19课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/20.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第20课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/21.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第21课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/22.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第22课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/23.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第23课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/24.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第24课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/25.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第25课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/25.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第25课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/24.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第24课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/26.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第26课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/27.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第27课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/28.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第28课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/29.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第29课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/30.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第30课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/31.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第32课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/32.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第32课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    },
    {
      file: "resources/mp3/33.mp3",
      thumb: "resources/thumbs/01.jpg",
      trackName: "中泰通泰语课程第33课",
      trackArtist: "中泰通",
      trackAlbum: "Single",
    }
  ]
}

$(".jAudio--player").jAudio(t);
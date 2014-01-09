(function($) {
    
    // private methods
    function getAverageVolume(array) {
        var values = 0;
        var average;
        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
    };
    
    function Pulse(element, options) {
        this.$element = $(element);
        this.options = options;
        this.analyser = null;
        this.start();
    };
    
    Pulse.prototype = {
        start: function() {
            this.options.base = {};
            
            for (var prop in this.options.attributes) {
                if (typeof this.$element[prop] == 'function') {
                    this.options.base[prop] = this.$element[prop]();
                } else {
                    this.options.base[prop] = parseInt(this.$element.css(prop).replace('px', ''), 10);
                }
            }
            
            try {
                var context = new webkitAudioContext();

                // Create an AudioNode from the stream.
                this.mediaStreamSource = context.createMediaStreamSource(this.options.stream);

                // setup a analyzer
                this.analyser = context.createAnalyser();
                this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
                this.analyser.fftSize = 1024;

                // connect the source to the analyser
                this.mediaStreamSource.connect(this.analyser);
                
                this.render();
            } catch(e) {
                
                if (typeof this.options.error == 'function') error();
            }
        },
        
        stop: function() {
            cancelAnimationFrame(this.audioAnimation);
        },
        
        render: function() {
            
            if (!window.requestAnimationFrame) return;

            var array =  new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(array);
            var average = getAverageVolume(array);
            var self = this;
            
            for (var prop in this.options.attributes) {
                var total = this.options.attributes[prop];
                var base = this.options.base[prop];
                var amount = (total/100)*average;
                
                this.$element.css(prop, Math.floor(base + amount)+'px');
            }
            
            this.audioAnimation = requestAnimationFrame(this.render.bind(this));
        }
    };
    
    $.fn.pulse = function(options) {
        
        if (typeof options == 'string') {
            var pulse = this.data('pulse');
            if (pulse) pulse[options]();
            return this;
        }
                
        options = $.extend({}, $.fn.pulse.defaults, options);
        
        this.each(function() {
            
            var pulse = $.data(this, 'pulse');
            if (!pulse) {
                pulse = new Pulse(this, options);
                $.data(this, 'pulse', pulse);
            }
            return pulse;
        });
        
        return this;
    };
    
    $.fn.pulse.defaults = {
        stream: null,
        smoothingTimeConstant: 0.3,
        attributes: {
            'width': 10,
            'height': 10,
            'margin-top': -5,
            'margin-left': -5
        }
    };

})(jQuery);

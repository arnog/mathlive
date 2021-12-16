(function($){
	function search_map(arr, fn){
		if(arr.map){
			arr = arr.map(fn);
		}
		else{
			for(var i = 0, l = arr.length; i < l; i++){
				arr[i] = fn(arr[i]);
			}
		}

		return arr;
	};

	function SAgent(e, classList){
		e = $(e);
		this.e = e;
		this.s = e.find('.search').get(0);
		var list = search_map(classList, function(e){ return '.' + e; });
		this.list = e.find(list.join(','));

		var that = this;

		function keyEvent(input, caller){
			function ev(){
				if(input.value === ''){
					caller.end();
				}
				else{
					caller.search(input.value.toLowerCase());
				}
			}

			$(input).on('input', ev);
			$(input).on('propertychange input', ev);
			$(input).keyup(function(e) {
				var code = e.code || e.which;
				if (code == 8 || code == 46) { //backspace and delete key
					ev();
				}
			});
		}

		keyEvent(this.s, this);
	}

	SAgent.prototype.search = function(value){
		this.list.each(function(i, e){
			var contents = e.innerHTML || e.value;
			contents = contents.toLowerCase();
			if(contents.indexOf(value) === -1){
				$(e).hide();
			}
			else{
				$(e).show();
			}
		});
	};

	SAgent.prototype.end = function(){
		this.list.each(function(i, e){
			$(e).show();
		});
	};

	$.fn.search = function(classList){
		return new SAgent(this, classList);
	};

})(jQuery);
/* Minimal ANSI -> HTML parser for SGR codes */
(function(global){
  'use strict';

  function escapeHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  var FG = {
    30: 'black',31:'red',32:'green',33:'#b58900',34:'blue',35:'magenta',36:'cyan',37:'#e5eef6',
    90:'#6b7280',91:'#ff6b6b',92:'#6bd26b',93:'#ffd966',94:'#6aa6ff',95:'#d580ff',96:'#66ffff',97:'#ffffff'
  };
  var BG = {
    40:'black',41:'red',42:'green',43:'#b58900',44:'blue',45:'magenta',46:'cyan',47:'#e6eef6',
    100:'#2b2b2b',101:'#5f1f1f',102:'#163d16',103:'#3f2f00',104:'#14305f',105:'#4b1f4b',106:'#004b4b',107:'#f3f3f3'
  };

  function applySpan(text, style){
    if(!style) return escapeHtml(text);
    var css = [];
    if(style.fg) css.push('color:'+style.fg);
    if(style.bg) css.push('background-color:'+style.bg);
    if(style.bold) css.push('font-weight:700');
    if(style.italic) css.push('font-style:italic');
    if(style.underline) css.push('text-decoration:underline');
    return '<span class="styled-segment" data-testid="styled-segment" style="'+css.join(';')+'">'+escapeHtml(text)+'</span>';
  }

  function parseAnsi(input){
    if(!input) return '';
    var re = /\x1b\[([0-9;]*)m/g;
    var out = '';
    var last = 0;
    var match;
    var state = {fg:null,bg:null,bold:false,italic:false,underline:false};
    while((match = re.exec(input)) !== null){
      var idx = match.index;
      var chunk = input.substring(last, idx);
      if(chunk) out += applySpan(chunk, Object.assign({},state));
      last = re.lastIndex;
      var seq = match[1];
      var parts = seq.length? seq.split(';').map(Number) : [0];
      for(var i=0;i<parts.length;i++){
        var code = parts[i];
        if(code===0){ state = {fg:null,bg:null,bold:false,italic:false,underline:false}; }
        else if(code===1){ state.bold = true; }
        else if(code===3){ state.italic = true; }
        else if(code===4){ state.underline = true; }
        else if(code===22){ state.bold = false; }
        else if(code===23){ state.italic = false; }
        else if(code===24){ state.underline = false; }
        else if((code>=30 && code<=37) || (code>=90 && code<=97)){
          state.fg = FG[code] || null;
        }
        else if(code===39){ state.fg = null; }
        else if((code>=40 && code<=47) || (code>=100 && code<=107)){
          state.bg = BG[code] || null;
        }
        else if(code===49){ state.bg = null; }
        else if(code===38){
          // foreground extended; expect 38;2;r;g;b
          if(parts[i+1]===2 && parts.length > i+4){
            var r = parts[i+2], g = parts[i+3], b = parts[i+4];
            state.fg = 'rgb('+r+','+g+','+b+')';
            i += 4;
          }
        }
        else if(code===48){
          // background extended; expect 48;2;r;g;b
          if(parts[i+1]===2 && parts.length > i+4){
            var br = parts[i+2], bgc = parts[i+3], bb = parts[i+4];
            state.bg = 'rgb('+br+','+bgc+','+bb+')';
            i += 4;
          }
        }
      }
    }
    // remainder
    var rest = input.substring(last);
    if(rest) out += applySpan(rest, Object.assign({},state));
    return out;
  }

  global.ansiParser = { toHtml: parseAnsi };
})(window);

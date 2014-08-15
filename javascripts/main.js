

(function($){
  var github_id = $.cookie('github_id');

  window.SassMeister.menu = {
    template: {
      create: $('#tmpl-menu-create').clone().html(),
      fork: $('#tmpl-menu-fork').clone().html(),
      login: $('#tmpl-menu-login').clone().html(),
      view: $('#tmpl-menu-view').clone().html(),
      reset: $('#tmpl-menu-reset').clone().html()
    },

    build: function() {
      var menu = $('<ul/>');

      if(!! github_id) {
        menu.append($('<li/>').append(this.template.create));

        if(!! (window.gist && (window.gist.gist_owner == github_id))) {
          menu.find('[data-action="create"]').attr('data-action', 'edit');
        }
      }
      if(!! (github_id && window.gist)) {
        menu.append($('<li/>').append(this.template.fork));
      }
      if(! github_id) {
        menu.append($('<li/>').append(this.template.login));
      }
      if(window.gist) {
        menu.append($('<li/>').append(this.template.view));
        menu.html(menu.html().replace(/{{gist_id}}/, window.gist.gist_id))
      }

      menu.append($('<li/>').append(this.template.reset));

      $('#cloud_actions').html(menu.html());
    }

  };


  $(document.body).on('click', '#cloud_actions [data-action]', function(event) {
    event.preventDefault();

    SassMeister.gist[($(this).data('action'))]();
  });

  $(document.body).on('click', '#reset', function(event) {
    event.preventDefault();

    SassMeister.reset();
  });
})(jQuery);




(function($) {
if($('body.app, body.embedded').length > 0 ) {
  var SassMeister = window.SassMeister.init();

  $('#rendered-html').attr('src', window.sandbox);

  $("a[href^='http://'], a[href^='https://']").attr('target', '_blank');

  $('#mobile-tabs h2').on('click', function(event) {
    if($('body').hasClass('single-column')) {
      $('.panel').removeClass('show-panel').addClass('hide-panel');
      $('#mobile-tabs .current').removeClass('current');
      $(this).toggleClass('current')

      $('[data-name="' + $(this).data('tab') + '"]').removeClass('hide-panel').addClass('show-panel');
    }

    else {
      $('.panel').removeClass('hide-panel').removeClass('show-panel');
    }

    SassMeister.resizeEditors();
  });


  window.onmessage = function (event) {
    if(event.origin == window.sandbox && SassMeister.layout.html == 'show') {
      if(SassMeister.outputs.html) {
        SassMeister.updateRender(SassMeister.outputs);
      }
      else {
        SassMeister.compile.html();
      }
    }
  };

  if($('body.app').length > 0 ) {
    SassMeister.editors.sass.focus();
  }
}


if($('body.app').length > 0 ) {
  var github_id = $.cookie('github_id'),
      gravatar_id = $.cookie('gravatar_id');

  if(github_id && gravatar_id) {
    $('#github-auth').replaceWith('<div><span><img src="http://www.gravatar.com/avatar/' + gravatar_id + '?s=80" alt="" height="40"></span>\
      <ul id="account_actions">\
        <li class="checkmark-icon"><svg class="checkmark-icon"><use xlink:href="' + window.imagePath + '/icons.svg#checkmark"></use></svg> Hello, ' + github_id + '!</li>\
        <li class="off-icon"><a href="/logout"><svg class="power-icon"><use xlink:href="' + window.imagePath + '/icons.svg#power"></use></svg> <span>Logout</span></a></li>\
      </ul>\
    </div>');
  }


  SassMeister.menu.build();

  $('#control-column-bg').on('click', function(event) {
    $('#control-column, #control-column-bg').removeClass('open');
  });

  $("#control-column").on('click', function(event) {
    event.stopPropagation();
  });

  $('#open-controls, #close-controls').on('click', function(event) {
    event.stopPropagation();
    $('#control-column, #control-column-bg').toggleClass('open');
  });


  var initControls = function() {
    $('.sass-syntax-display').text(SassMeister.inputs.sass.syntax);
    $('.html-syntax-display').text(SassMeister.inputs.html.syntax);
    $('select[name="version"] option[value="' + SassMeister.inputs.sass.compiler + '"]').prop('selected', true);
    $('input[name="syntax"][value="' + SassMeister.inputs.sass.syntax.toLowerCase() + '"]').prop('checked', true);
    $('input[name="output-style"][value="' + SassMeister.inputs.sass.output_style + '"]').prop('checked', true);
    $('input[name="html-syntax"][value="' + SassMeister.inputs.html.syntax + '"]').prop('checked', true);
    $('select[name="theme"] option[value="' + SassMeister.preferences.theme + '"]').prop('selected', true);
    $('input[name="emmet"]').prop('checked', SassMeister.preferences.emmet);
    $('input[name="vim"]').prop('checked', SassMeister.preferences.vim);

    $('select[name="theme"]').dropdown({
      gutter : 0,
      speed : 25,
      onOptionSelect: function(opt) {
        SassMeister.setTheme(opt.data('value'));
      }
    });

    $('select[name="version"]').dropdown({
      gutter : 0,
      speed : 25,
      onOptionSelect: function(opt) {
        _gaq.push(['_trackEvent', 'UI', 'SassVersion', 'v ' + opt.data('value')]);

        SassMeister.inputs.sass.compiler = opt.data('value');

        getExtensions();
        SassMeister.compile.sass();
      }
    });

    ace.require("ace/ext/emmet");

    $('.edit-prefs input[type="checkbox"]').on('change', function(event) {
      SassMeister.setEditorPreferences($(this).attr('name'), $(this).prop('checked'));
    });
  };

  initControls();


  $('.orientation').on('click', function(event) {
    var orientation = $(this).data('orientation')

    _gaq.push(['_trackEvent', 'UI', 'Orientation', orientation]);

    $('#source').casement('destroy');
    $('#casement').casement('destroy');

    SassMeister.arrangePanels(orientation);
  });


  $('[data-toggle-input]').on('click', function(event) {
    var selected = $('#' + $(this).attr('for')).val(),
        input = $(this).data('toggle-input');

    if (input == 'sass') {
      _gaq.push(['_trackEvent', 'UI', 'SassSyntax', selected]);

      SassMeister.inputs.sass.syntax = selected;
      $('.sass-syntax-display').text($(this).text());

      SassMeister.convert.sass();
      SassMeister.editors.sass.getSession().setMode('ace/mode/' + selected.toLowerCase());
    }
    if (input == 'css') {
      _gaq.push(['_trackEvent', 'UI', 'CSSOutput', selected]);

      SassMeister.inputs.sass.output_style = selected;

      SassMeister.compile.sass();
    }
    if (input == 'html') {
      _gaq.push(['_trackEvent', 'UI', 'HTMLSyntax', selected]);

      SassMeister.inputs.html.syntax = selected;
      $('.html-syntax-display').text($(this).text());

      SassMeister.compile.html();
      SassMeister.editors.html.getSession().setMode("ace/mode/" + selected.toLowerCase());
    }
  });


  var buildExtensionList = function(data) {
    var list = $('<ol />');

    $.each(data, function(name, info) {
      list.append('<li><a data-import="' + info.import + '">' + name + '</a>' + (info.version ? '&nbsp;&nbsp;(v' + info.version + ')' : '' ) + '</li>');
    });

    return list;
  };


  var getExtensions = function() {
    var html = $('input[value=\'' + SassMeister.inputs.sass.compiler + '\']').data('extensions');

    if(html) {
      $('#extension_list ol').replaceWith(buildExtensionList(html));
      return;
    }

    if(SassMeister.ajaxCalls.getExtensions) {
      SassMeister.ajaxCalls.getExtensions.abort();
    }

    SassMeister.ajaxCalls.getExtensions = $.get('/app/' + SassMeister.inputs.sass.compiler + '/extensions')
      .done(function( data ) {
        $('#extension_list ol').replaceWith(buildExtensionList(data));
        $('input[value=\'' + SassMeister.inputs.sass.compiler + '\']').data('extensions', data);
      })
      .always(function() {
        SassMeister.ajaxCalls.getExtensions = false;
      });
  };

  getExtensions();


  $('#control-column').on('click', 'a[data-import]', function(event) {
    var imports = $(this).data('import'),
        eol = ( SassMeister.inputs.sass.syntax == 'SCSS' ? ';' : '' ) + '\n';

    _gaq.push(['_trackEvent', 'UI', 'SassExtensions', imports]);

    if(String(imports) === 'true') {
      imports = [imports];
    }
    else {
      imports = imports.split(',');
    }

    $(imports).each(function() {
      SassMeister.editors.sass.insert( '@import "' + this + '"' + eol);
    });
  });


  var toggleCSSPanel = function(state) {
    _gaq.push(['_trackEvent', 'UI', 'ToggleCSS', state]);

    $('#source').casement('destroy');
    $('#casement').casement('destroy');

    $('[data-name="css"]')[state]();

    $('#rendered')[SassMeister.layout.html]();
    $('[data-name="html"]')[SassMeister.layout.html]();

    SassMeister.layout.css = state;

    SassMeister.arrangePanels(SassMeister.layout.orientation);

    localStorage.setItem('layout', JSON.stringify( SassMeister.layout ));
  };


  var toggleHTMLPanels = function(state) {
    _gaq.push(['_trackEvent', 'UI', 'ToggleHTML', state]);

    $('#source').casement('destroy');
    $('#casement').casement('destroy');

    $('#rendered')[state]();
    $('[data-name="html"]')[state]();

    $('[data-name="css"]')[SassMeister.layout.css]();

    SassMeister.layout.html = state;

    SassMeister.arrangePanels(SassMeister.layout.orientation);

    localStorage.setItem('layout', JSON.stringify( SassMeister.layout ));
  };




  $('#toggle_css').on('click', function(event) {
    event.preventDefault();

    var state = $(this).data('state');

    toggleCSSPanel(state);

    if(state == 'hide') {
      $(this).data("state", 'show').addClass('show');
    }
    else {
      $(this).data("state", 'hide').removeClass('show');
    }
  });

  $('#toggle_html').on('click', function(event) {
    event.preventDefault();

    var state = $(this).data('state')

    toggleHTMLPanels(state);

    if(state == 'hide') {
      $(this).data("state", 'show').addClass('show');
    }
    else {
      $(this).data("state", 'hide').removeClass('show').find('span');
    }
  });
}


if($('body.oops-404').length > 0 ) {
  var gotogist = function() {
    var id = document.getElementById('gist-id').value;

    if(id) {
      window.location = '/gist/' + id;
    }

    return true;
  };

  $('#gist-id').on('keydown', function(event) {
    if(event.which == 13) {
      gotogist();
    }
  });

  $('button').on('click', gotogist);
}
})(jQuery);

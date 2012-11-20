# Those little ditties that Sinara needs to make the magic happen
# -----------------------------------------------------------------------
require 'rubygems'

# If you're using bundler, you will need to add this
require 'bundler/setup'

require 'sinatra'
require 'sinatra/partial'
require 'json'
require 'github_api'

require 'sass'
require 'compass'


set :partial_template_engine, :erb

enable :sessions

configure :production do
  helpers do
    def github(auth_token = '')
      github = Github.new do |config|
        config.client_id = ENV['GITHUB_ID']
        config.client_secret = ENV['GITHUB_SECRET']
        config.oauth_token = auth_token
      end
    end
  end
end

configure :development do
  require 'yaml'

  helpers do
    def github(auth_token = '')
      gh_config = YAML.load_file("github.yml")

      github = Github.new do |config|
        config.client_id = gh_config['client_id']
        config.client_secret = gh_config['client_secret']
        config.oauth_token = auth_token
      end
    end
  end
end




helpers do
  include ERB::Util
  alias_method :code, :html_escape

  # From: http://rubyquicktips.com/post/2625525454/random-array-item
  class Array
    def random
      shuffle.first
    end
  end

  def plugins
    {
      "bourbon" => {gem: 'bourbon-compass', import: 'bourbon/bourbon'},
      "breakpoint" => {gem: 'breakpoint', import: 'breakpoint'},
      "compass" => {gem: 'compass', import: 'compass'},
      "sassy-buttons" => {gem: 'sassy-buttons', import: 'sassy-buttons'},
      "singularity.gs" => {gem: 'singularitygs', import: 'singularitygs'},
      "stipe" => {gem: 'stipe', import: './sass/stipe'},
      "susy" => {gem: 'susy', import: 'susy'},
    }.each do |plugin|
      plugin.last[:version] = Gem.loaded_specs[plugin.last[:gem]].version.to_s
    end
  end

  def import_plugin(params)
    Compass.sass_engine_options[:load_paths].each do |path|
      Sass.load_paths << path
    end

    if plugins.has_key?(params[:plugin])
      require plugins[params[:plugin]][:gem]

      sass = "@import \"#{plugins[params[:plugin]][:import]}\"#{";" if params[:syntax] == 'scss'}\n\n#{params[:sass]}"
    else
      sass = params[:sass]
    end
  end

  def compile_sass(params, sass)
    begin
      send("#{params[:syntax]}".to_sym, sass.chomp, {:style => :"#{params[:output]}", :quiet => true})

    rescue Sass::SyntaxError => e
      status 200
      e.to_s
    end
  end
end

before do
  @github = github(session[:github])
end


get '/' do
  @plugins = plugins

  erb :index
end


post '/compile' do
  sass = import_plugin(params)

  compile_sass(params, sass)
end


get '/thankyou' do
  erb :thankyou
end


get '/authorize' do
  redirect to @github.authorize_url :scope => 'gist'
end


get '/authorize/return' do
  token = @github.get_token(params[:code])

  session[:github] = token.token

  redirect to('/')
end


post '/gist/?:edit?' do
  sass = import_plugin(params)
  css = compile_sass(params, sass)

  description = "Generated by SassMeister.com, the Sass playground."

  sass_file = "SassMeister.#{params[:syntax]}"
  css_file = "SassMeister.css"

  if params[:edit]
    data = @github.gists.edit(session[:gist], files: {
      css_file => {
        content: "#{css}"
      },
      sass_file => {
        content: "#{sass}"
      }
    })
  else
    data = @github.gists.create(description: description, public: true, files: {
      css_file => {
        content: "#{css}"
      },
      sass_file => {
        content: "#{sass}"
      }
    })
  end

  session[:gist] = data.id.to_s

  "https://gist.github.com/#{data.id}"
end
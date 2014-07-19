desc 'Release the Kraken!'
task :deploy do
  Rake::Task['assets:precompile'].invoke

  system('bundle exec s3_website push --site public')

  system('git push heroku')
  system('git push origin')
end

desc 'Run the app\'s server in either development or production mode'
task :server do
  environment = 'development'

  if ARGV.last.match(/(development|production)/)
    environment = ARGV.last
  end

  Rake::Task['assets:precompile'].invoke

  puts "Starting SassMeister in #{environment.upcase} mode..."

  system("bundle exec rackup config.ru -p 3000 -E #{environment}")

  task environment.to_sym do ; end
end


# Heroku will run this task as part of the deployment process.
desc 'Compile the app\'s Sass'
task 'assets:precompile' do
  require 'execjs'
  require 'yaml'
  require 'digest/sha1'

  Dir.mkdir('public/js/') unless Dir.exists? 'public/js/'
  Dir.mkdir('javascripts/compiled/') unless Dir.exists? 'javascripts/compiled/'


  system('rm public/css/*')
  system('rm public/js/*')

  context = ExecJS.compile File.read('lib/coffee-script.js')

  Dir.glob('coffee/*.coffee').each do |file|
    name = file.gsub('coffee/', '').gsub('.coffee', '')
    js = context.call('CoffeeScript.compile', File.read(file))

    File.open("javascripts/compiled/#{name}.js", 'w') {|f| f.write(js) }
  end

  system('bundle exec jammit --force')
  system('bundle exec compass compile --force -e production')

  assets = YAML.load_file("config/assets.yml")
  manifest = {}

  assets['javascripts'].each do |js|
    file = File.read("public/js/#{js[0]}.js")
    sha1 = Digest::SHA1.hexdigest(file).slice(0..15)

    manifest[js[0]] = sha1

    File.open("public/js/#{js[0]}-#{sha1}.js", 'w') {|f| f.write(file) }
  end

  file = File.read('public/css/style.css')
  sha1 = Digest::SHA1.hexdigest(file).slice(0..15)

  manifest['style'] = sha1

  File.open("public/css/style-#{sha1}.css", 'w') {|f| f.write(file) }

  File.open("config/asset-manifest.yml", 'w') {|f| f.write(manifest.to_yaml) }
end


desc 'Compile the app\'s icons to an SVG sprite'
task 'svg:sprite' do
  require 'nokogiri'

  @doc = Nokogiri::XML::Document.new

  @svg = @doc.add_child Nokogiri::XML::Node.new "svg", @doc

  @svg['xmlns'] = 'http://www.w3.org/2000/svg'

  Dir.glob('svg/*.svg').each do |file|
    node = Nokogiri::XML(File.open(file)).css('svg').first

    id = file.split('/')[1].split('.')[0]

    symbol = Nokogiri::XML::Node.new "symbol", @doc
    symbol['viewBox'] = node['viewBox']
    symbol['id'] = id
    symbol << "<title>#{id}</title>"
    symbol << node.children.to_xml.strip

    @svg.add_child(symbol)
  end

  File.open("public/images/icons.svg", 'w') {|f| f.write(@doc.to_xml.gsub(/(\n|\t|\s{2,})/, '')) }
end

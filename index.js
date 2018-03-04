var ytdl = require('ytdl-core')
var FFmpeg = require('fluent-ffmpeg')
var through = require('through2')
var xtend = require('xtend')
var fs = require('fs')

module.exports = streamify

function streamify (uri, opt, ytdlOpts, throughOpts) {
  opt = xtend({
    videoFormat: 'mp4',
    quality: 'lowest',
    audioFormat: 'mp3',
    applyOptions: function () {}
  }, opt)


  function filterVideo (format) {
    return (
      format.container === opt.videoFormat &&
      format.audioEncoding
    )
  }

  var ytdlOpts = Object.assign({filter: filterVideo, quality: opt.quality}, ytdlOpts || {})
  
  var video = ytdl(uri, ytdlOpts)


  var stream = opt.file
    ? fs.createWriteStream(opt.file)
    : through(throughOpts || {})

  var ffmpeg = new FFmpeg(video)
  opt.applyOptions(ffmpeg)
  var output = ffmpeg
    .format(opt.audioFormat)
    .pipe(stream)

  video.on('info', stream.emit.bind(stream, 'info'))
  ffmpeg.on('error', stream.emit.bind(stream, 'error'))
  output.on('error', video.end.bind(video))
  output.on('error', stream.emit.bind(stream, 'error'))
  return stream
}

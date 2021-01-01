const zlib = require('zlib')
const drop = require('drag-and-drop-files')
const fileReaderStream = require('filereader-stream')
const concat = require('concat-stream')
const $ = require('jquery')

var LOADED_DATA = null

function LoadSubmarine(xmlData) {
	var $xmlData = $(xmlData)
	var $submarine = $xmlData.find('Submarine')

	var name = $submarine.attr('name')
	console.log(`Opened ${name} successfully`)

	LOADED_DATA = { xmlData, $xmlData, $submarine, name }

	$('#tools').attr('hidden', false)
	$('#loadedInfo .name').text(name)

	// shuttle extract button - generated dynamically
	$('.shuttle-button').remove()
	$submarine.find('LinkedSubmarine').each(function () {
		var name = $(this).attr('name')
		var button = $(`<button class=".shuttle-button">Extract ${name} shuttle</button>`)
		$('#extract-buttons').append(button)
		button.on('click', async () => {
			var string = $(this)
				.prop('outerHTML')
				.replace(/LinkedSubmarine/g, 'Submarine')

			var output = zlib.gzipSync(string)

			var blob = new Blob([output.buffer], { type: 'application/gzip' })
			var blobUrl = URL.createObjectURL(blob)

			var a = document.createElement('a')
			a.href = blobUrl
			a.download = `${name}.sub`
			a.click()

			console.log(`Prompted to download ${name}.sub`)
		})
	})
}

// dropbox hadling
drop(document.getElementById('drop'), function (files) {
	var file = files[0]

	if (!file.name.endsWith('.sub')) {
		window.alert('Selected file is not a ".sub" file')
		return console.warn('Selected file is not a ".sub" file')
	}

	fileReaderStream(file).pipe(
		concat(function (contents) {
			var output = zlib.gunzipSync(contents).toString('utf-8')
			console.log('File loaded successfully')
			var xmlData = $.parseXML(output)
			LoadSubmarine(xmlData)
		})
	)
})

// extract image
$('#extract-image').on('click', () => {
	if (!LOADED_DATA) return console.error('No submarine loaded')
	var base64 = LOADED_DATA.$submarine.attr('previewimage')

	var a = document.createElement('a')
	a.href = 'data:image/png;base64,' + base64
	a.download = `${LOADED_DATA.name}.png`
	a.click()
	console.log(`Prompted to download ${LOADED_DATA.name}.png`)
})

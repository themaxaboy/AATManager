// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require('electron').ipcRenderer
const fs = require("fs")
const shell = require('electron').shell
const settings = require('electron-settings');
const {
    execFile
} = require('child_process')

const selectDirBtn = document.getElementById('select-directory-input')
const selectOutBtn = document.getElementById('select-directory-output')

const selectAutoBtn = document.getElementById('buttonAuto')
const selectStartBtn = document.getElementById('buttonStart')
const selectStopBtn = document.getElementById('buttonStop')
const selectDownloadBtn = document.getElementById('buttonDownload')

const selectSaveBtn = document.getElementById('buttonSave')

const homePage = document.getElementById('homePage')
const ResultPage = document.getElementById('resultPage')
const LogPage = document.getElementById('logPage')
const SettingPage = document.getElementById('settingPage')

let storagePath = '';
let outputDirectory = '';
let inputDirectory = '';

//Go to home on first time
changePage('home')
loadSettingData()
loadFileState()

selectDirBtn.addEventListener('click', function (event) {
    ipc.send('open-file-dialog-input')
})

ipc.on('selected-directory-input', function (event, path) {
    document.getElementById('selected-directory-input').value = path

    settings.set('setting', {
        inputDirectory: path
    })
    loadFileState()
})

selectOutBtn.addEventListener('click', function (event) {
    ipc.send('open-file-dialog-output')
})

ipc.on('selected-directory-output', function (event, path) {
    document.getElementById('selected-directory-output').value = path
})

selectAutoBtn.addEventListener('click', function (event) {
    console.log('Click Auto')
    selectStopBtn.className = 'btn btn-outline-danger'
    selectAutoBtn.className = 'btn btn-outline-success disabled'
    selectStartBtn.className = 'btn btn-outline-success disabled'

    selectDownloadBtn.className = 'btn btn-outline-primary'

    autoProcess()
})

selectStartBtn.addEventListener('click', function (event) {
    console.log('Click Start')
    selectStopBtn.className = 'btn btn-outline-danger'
    selectAutoBtn.className = 'btn btn-outline-success disabled'
    selectStartBtn.className = 'btn btn-outline-success disabled'

    selectDownloadBtn.className = 'btn btn-outline-primary'

    startProcess()
})

selectStopBtn.addEventListener('click', function (event) {
    console.log('Click Stop')
    selectStopBtn.className = 'btn btn-outline-danger disabled'
    selectAutoBtn.className = 'btn btn-outline-success'
    selectStartBtn.className = 'btn btn-outline-success'

    stopProcess()
})

selectDownloadBtn.addEventListener('click', function (event) {
    console.log('Click Download')
    selectDownloadBtn.className = 'btn btn-outline-primary disabled'

    downloadProcess()
})

selectSaveBtn.addEventListener('click', function (event) {
    console.log('Click Save')

    inputDirectory = document.getElementById('selected-directory-input').value
    outputDirectory = document.getElementById('selected-directory-output').value
    storagePath = document.getElementById('storagePath').value

    settings.set('setting', {
        inputDirectory: inputDirectory,
        storagePath: storagePath,
        outputDirectory: outputDirectory
    });

    document.getElementById('buttonSave').innerHTML = 'Saved!'
    setTimeout(function () {
        document.getElementById('buttonSave').innerHTML = 'Save'
    }, 1000);
})

function loadSettingData(page) {
    if (settings.has('setting.inputDirectory')) {
        document.getElementById('selected-directory-input').value = settings.get('setting.inputDirectory')
        inputDirectory = settings.get('setting.inputDirectory')
    }
    if (settings.has('setting.outputDirectory')) {
        document.getElementById('selected-directory-output').value = settings.get('setting.outputDirectory')
        outputDirectory = settings.get('setting.outputDirectory')
    }
    if (settings.has('setting.storagePath')) {
        document.getElementById('storagePath').value = settings.get('setting.storagePath')
        storagePath = settings.get('setting.storagePath')
    }
}

homePage.addEventListener('click', function (event) {
    console.log('Click homePage')
    changePage('home')
})

ResultPage.addEventListener('click', function (event) {
    console.log('Click ResultPage')
    changePage('result')
    listResult()
})

LogPage.addEventListener('click', function (event) {
    console.log('Click LogPage')
    changePage('log')
})

SettingPage.addEventListener('click', function (event) {
    console.log('Click SettingPage')
    changePage('setting')
})

function changePage(page) {
    let pageName = ['home', 'result', 'log', 'setting']

    pageName.forEach(function (element) {
        if (page == element) {
            document.getElementById(element + 'Page').className = 'active nav-link'
            document.getElementById(element).style.display = 'block'
        } else {
            document.getElementById(element + 'Page').className = 'nav-link'
            document.getElementById(element).style.display = 'none'
        }
    });
}

function startProcess() {
    let startCommand = [
        'shell pm uninstall com.dst.hitradex',
        'shell pm uninstall com.dst.hitradex.test',

        'shell rm -f /storage/emulated/0/Android/data/com.dst.hitradex/files/Output.xls',
        'shell rm -r /storage/emulated/0/Android/data/com.dst.hitradex/files/Test-Screenshots',

        'push ' + inputDirectory + '//' + 'app-debug.apk /data/local/tmp/com.dst.hitradex',
        'push ' + inputDirectory + '//' + 'app-debug-androidTest.apk /data/local/tmp/com.dst.hitradex.test',

        'push ' + inputDirectory + '//' + 'Components.xls ' + storagePath,
        'push ' + inputDirectory + '//' + 'Controller.xls ' + storagePath,
        'push ' + inputDirectory + '//' + 'Input.xls '+ storagePath,
        'push ' + inputDirectory + '//' + 'TestData.xls '+ storagePath,

        'shell pm install -r "/data/local/tmp/com.dst.hitradex" pkg: /data/local/tmp/com.dst.hitradex',
        'shell pm install -r "/data/local/tmp/com.dst.hitradex.test" pkg: /data/local/tmp/com.dst.hitradex.test',
        'shell pm grant com.dst.hitradex android.permission.READ_EXTERNAL_STORAGE',
        'shell pm grant com.dst.hitradex android.permission.WRITE_EXTERNAL_STORAGE',

        'shell am instrument -w -r   -e debug false -e class com.dst.hitradex.ui.activity.Controller com.dst.hitradex.test/android.support.test.runner.AndroidJUnitRunner'
    ]

    let sendError = ipc.send('open-error-dialog-start')

    startCommand.forEach(function (element, sendError) {
        let child = execFile('adb', element.split(" "), (error, stdout, stderr) => {
            if (error) {
                sendError
                throw error
                return false
            }
            console.log(stdout)
        })
    })

    let child = execFile('ping', ['-t', 'localhost'], (error, stdout, stderr) => {
        if (error) {
            throw error
        }
    })
    child.stdout.on('data', function (data) {
        console.log(data.toString())
        document.getElementById('logTextarea').innerHTML += data
        document.getElementById('logTextarea').scrollTop = document.getElementById('logTextarea').scrollHeight;
    })
}

function stopProcess() {
    let stopCommand = [
        'shell am force-stop com.dst.hitradex',
        'shell am force-stop com.dst.hitradex.test'
    ]

    let sendError = ipc.send('open-error-dialog-stop')

    stopCommand.forEach(function (element, sendError) {
        let child = execFile('adb', element.split(" "), (error, stdout, stderr) => {
            if (error) {
                sendError
                throw error
                return false
            }
            console.log(stdout)
        })
    })
}

function autoProcess() {
    startProcess()
    downloadProcess()
}

function downloadProcess() {
    let downloadCommand = [
        'pull /storage/emulated/0/Android/data/com.dst.hitradex/files/Output.xls ' + outputDirectory,
        'pull /storage/emulated/0/Android/data/com.dst.hitradex/files/Test-Screenshots ' + outputDirectory
    ]

    let renameOutput = [
        'Output.xls Output-%date:~10,4%%date:~7,2%%date:~4,2%-%time:~0,2%%time:~3,2%%time:~6,2%.xls'
    ]

    let renameTestScreenshots = [
        'MOVE Test-Screenshots Test-Screenshots-%date:~10,4%%date:~7,2%%date:~4,2%-%time:~0,2%%time:~3,2%%time:~6,2%'
    ]

    let sendError = ipc.send('open-error-dialog-download')

    downloadCommand.forEach(function (element, sendError) {
        let child = execFile('adb', element.split(" "), (error, stdout, stderr) => {
            if (error) {
                sendError
                throw error
                return false
            }
            console.log(stdout)
        })
    })

    /*renameOutput.forEach(function (element, sendError) {
        let child = execFile('cd',[outputDirectory])
            child = execFile('ren', element.split(" "), (error, stdout, stderr) => {
            if (error) {
                sendError
                throw error
                return false
            }
            console.log(stdout)
        })
    })*/
}

function listResult(page) {

    const resultFolder = document.getElementById('selected-directory-output').value
    let index = 1

    document.getElementById('resultTable').innerHTML = ''

    fs.readdirSync(resultFolder).forEach(file => {
        if (file.includes('.xls')) {
            let tr = document.createElement("tr")
            let tdIndex = document.createElement("td")
            tr.appendChild(tdIndex)
            tdIndex.appendChild(document.createTextNode(index++))

            let tdFile = document.createElement("td")
            tr.appendChild(tdFile)
            tdFile.appendChild(document.createTextNode(file))

            let tdDate = document.createElement("td")
            tr.appendChild(tdDate)
            tdDate.appendChild(document.createTextNode(
                new String (fs.statSync(resultFolder + '//' + file).mtime).substring(0, 25)
            ))

            let tdLink = document.createElement("td")
            tr.appendChild(tdLink)

            let buttonOpen = document.createElement("a")
            buttonOpen.className = 'btn btn-outline-primary'
            buttonOpen.href = '#'
            buttonOpen.innerText = 'Open'
            buttonOpen.addEventListener('click', function (event) {
                shell.openExternal(resultFolder + '\\' + file)
            })
            tdLink.appendChild(buttonOpen)

            tdLink.appendChild(document.createTextNode('  '))

            let buttonDel = document.createElement("a")
            buttonDel.className = 'btn btn-outline-danger'
            buttonDel.href = '#'
            buttonDel.innerText = 'Delete'
            buttonDel.addEventListener('click', function (event) {
                shell.moveItemToTrash(resultFolder + '\\' + file)
                listResult()
            })
            tdLink.appendChild(buttonDel)

            document.getElementById('resultTable').appendChild(tr)
        }
    })
}

function loadFileState() {
    let fileName = ['Components', 'Controller', 'Input', 'TestData']
    let allFileState = 0

    fileName.forEach(function (element) {
        fs.stat(document.getElementById('selected-directory-input').value + '/' + element + '.xls', function (err, stat) {
            if (err == null) {
                console.log('File exists')
                document.getElementById('list' + element).className = `list-group-item list-group-item-success`
                document.getElementById('list' + element).innerHTML = '<span class="badge badge-default bg-success"><i class="fa fa-fw fa-check-circle"></i></span>&nbsp; ' + element + '.xls'
                allFileState++
                if (allFileState == 4) {
                    document.getElementById('buttonAuto').className = 'btn btn-outline-success'
                    document.getElementById('buttonStart').className = 'btn btn-outline-success'
                }
            } else if (err.code == 'ENOENT') {
                // file does not exist
                //fs.writeFile('log.txt', 'Some log\n');
                console.log('File does not exist')
                document.getElementById('list' + element).className = `list-group-item list-group-item-danger`
                document.getElementById('list' + element).innerHTML = '<span class="badge badge-default bg-danger"><i class="fa fa-fw fa-times-circle"></i></span>&nbsp; ' + element + '.xls'
                document.getElementById('buttonAuto').className = 'btn btn-outline-success disabled'
                document.getElementById('buttonStart').className = 'btn btn-outline-success disabled'
                allFileState--
            } else {
                console.log('Some other error: ', err.code)
            }
        })
    })
}
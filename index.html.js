var userSettings = getSettings();
var currentWorkout = new Workout();

document.getElementById('divWorkoutInfo').addEventListener('input', function(e) {
    if (e.target.id == 'txtName') currentWorkout.name = e.target.value;
    if (e.target.id == 'txtDescription') currentWorkout.description = e.target.value;
    if (e.target.id == 'txtAuthor') currentWorkout.author = e.target.value;
    if (e.target.id == 'txtTags') currentWorkout.setTags(e.target.value);
});


document.getElementById('divSegmentButtons').addEventListener('click', function(e) {
    var svg;
    if (e.target.tagName.toLowerCase() == 'svg') 
        svg = e.target;
    else if (e.target.tagName.toLowerCase() == 'path') 
        svg = e.target.parentNode;
    else
        return;
        
    var t = svg.getAttribute('data-t');
    var p1 = svg.getAttribute('data-p-1');
    var d1 = svg.getAttribute('data-d-1');
    var p2 = svg.getAttribute('data-p-2');
    var d2 = svg.getAttribute('data-d-2');
    var r = svg.getAttribute('data-r');
    var segment = new Segment(t, p1, d1, p2, d2, r);
    currentWorkout.addSegment(segment);
    var svgs = segment.toSvgs(userSettings.horizSecondsPerPixel);
    var div = document.createElement('div');
    div.setAttribute('data-id', segment.id);
    var input = document.createElement('input');
    input.setAttribute('type', 'radio');
    input.setAttribute('id', segment.id);
    input.setAttribute('name', 'segment');
    var label = document.createElement('label');
    label.setAttribute('for', segment.id);
    for (var i = 0; i < svgs.length; i++) {
        label.appendChild(svgs[i]);
    }
    div.appendChild(input);
    div.appendChild(label);
    document.getElementById('divSegmentChart').appendChild(div);
    input.click();
}, false);


document.getElementById('btnSelectPrevious').addEventListener('click', function() {
    var selected = getSelectedSegment();
    if (!selected) return;
    if (!selected.previousSibling) return;
    selected.previousSibling.querySelector('input').click();
});


document.getElementById('btnSelectNext').addEventListener('click', function() {
    var selected = getSelectedSegment();
    if (!selected) return;
    if (!selected.nextSibling) return;
    selected.nextSibling.querySelector('input').click();
});


document.getElementById('btnMoveLeft').addEventListener('click', function(e) {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var previousBlock = selectedSegment.previousElementSibling;
    if (!previousBlock) return;
    
    var index = currentWorkout.segments.findIndex(s => s.id == selectedSegment.getAttribute('data-id'));
    var temp = currentWorkout.segments[index];
    currentWorkout.segments[index] = currentWorkout.segments[index-1];
    currentWorkout.segments[index-1] = temp;
    selectedSegment.parentNode.insertBefore(selectedSegment, previousBlock);
});


document.getElementById('btnMoveRight').addEventListener('click', function(e) {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var nextBlock = selectedSegment.nextElementSibling;
    if (!nextBlock) return;
    
    var index = currentWorkout.segments.findIndex(s => s.id == selectedSegment.getAttribute('data-id'));
    var temp = currentWorkout.segments[index];
    currentWorkout.segments[index] = currentWorkout.segments[index+1];
    currentWorkout.segments[index+1] = temp;
    selectedSegment.parentNode.insertBefore(nextBlock, selectedSegment);
});


document.getElementById('btnDelete').addEventListener('click', function(e) {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var index = currentWorkout.segments.findIndex(s => s.id == selectedSegment.getAttribute('data-id'));
    currentWorkout.segments.splice(index, 1);
    var previousBlock = selectedSegment.previousElementSibling;
    var nextBlock = selectedSegment.nextElementSibling;
    selectedSegment.parentNode.removeChild(selectedSegment);
    if (nextBlock) {
        nextBlock.querySelector('input[type=radio]').checked = true;
        loadSegment(nextBlock.getAttribute('data-id'));
    }
    else if (previousBlock) {
        previousBlock.querySelector('input[type=radio]').checked = true;
        loadSegment(previousBlock.getAttribute('data-id'));
    } else {
        loadNoSegment();
    }
});


document.getElementById('divSegmentChart').addEventListener('change', function(e) {
    loadSegment(e.target.id);
});


document.getElementById('btnShowCadence').addEventListener('click', function() {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;

    showModal('divModalCadence');
});


document.getElementById('btnShowTextEvents').addEventListener('click', function() {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;

    showModal('divModalTextEvents');
});


document.getElementById('btnDimissCadence').addEventListener('click', dismissModal);
document.getElementById('btnDimissTextEvents').addEventListener('click', dismissModal);

document.getElementById('chkCadence').addEventListener('click', function() {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    
    var txtC1 = document.getElementById('txtC1');
    var txtC2 = document.getElementById('txtC2');
    var segmentObj = currentWorkout.segments.find(s => s.id == selectedSegment.getAttribute('data-id'));
    
    if (this.checked) {
        segmentObj.c1 = 90;
        txtC1.value = 90;
        txtC1.removeAttribute('disabled');

        if (segmentObj.t == 'i') {
            segmentObj.c2 = 90;
            txtC2.value = 90;
            txtC2.removeAttribute('disabled');
        } else {
            txtC2.value = null;
            txtC2.setAttribute('disabled', true);
        }
    } else {
        if (segmentObj.hasOwnProperty('c1')) segmentObj.c1 = null;
        if (segmentObj.hasOwnProperty('c2')) segmentObj.c2 = null;
        txtC1.value = null;
        txtC2.value = null;
        txtC1.setAttribute('disabled', true);
        txtC2.setAttribute('disabled', true);
    }
});


document.getElementById('divSegmentInputs').addEventListener('input', function(e) {
    if (e.target.tagName != 'INPUT') return;
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    
    var segment = currentWorkout.segments.find(s => s.id == selectedSegment.getAttribute('data-id'));
    var targetProperty = e.target.getAttribute('data-target');
    var label = selectedSegment.querySelector('label');

    if (e.target.type == 'text') {
        var te = segment.textEvents.find(t => t.id == e.target.parentNode.parentNode.id);
        te.text = e.target.value;
        return; // no redraw if just changing textevent message
    }

    if (e.target.name == 'offset') {
        var te = segment.textEvents.find(t => t.id == e.target.parentNode.parentNode.id);
        te.offset = e.target.value;
    } else if (e.target.type == 'number') {
        segment[targetProperty] = e.target.value;
    }

    label.innerHTML = '';
    var svgs = segment.toSvgs(userSettings.horizSecondsPerPixel);
    for (var i = 0; i < svgs.length; i++) {
        label.appendChild(svgs[i]);
    }
});


document.getElementById('btnAddTextEvent').addEventListener('click', function() {
    var selectedSegment = getSelectedSegment();
    if (!selectedSegment) return;
    var text = document.querySelector('#divTextEventToClone input').value;
    var offset = document.querySelector('#divTextEventToClone input[type=number]').value;
    var id = currentWorkout.segments.find(s => s.id == selectedSegment.getAttribute('data-id')).addTextEvent(text, offset);
    addTextEventControls({id:id,text:text,offset:offset});
});


document.getElementById('divTextEvents').addEventListener('click', function(e) {
    if (e.target.tagName != 'BUTTON') return;
    var divToDelete = e.target.parentNode.parentNode;
    var segment = currentWorkout.segments.find(s => s.id == getSelectedSegment().getAttribute('data-id'));
    var textEventIndexToDelete = segment.textEvents.findIndex(t => t.id == divToDelete.id);
    segment.textEvents.splice(textEventIndexToDelete, 1);
    divToDelete.parentNode.removeChild(divToDelete);
});


document.getElementById('btnSaveToMyWorkouts').addEventListener('click', function() {
    var qs = createQueryString();
    var url = [location.protocol, '//', location.host, location.pathname, qs].join('');
    var a = document.createElement('a');
    a.href = url;
    a.setAttribute('class', 'transparent');
    var name = getName();
    a.innerText = name;
    var div = document.getElementById('divLinks');
    div.insertBefore(a, div.firstChild);
    window.setTimeout(function() { a.classList.add('opaque'); }, 15);

    if (!userSettings.rememberLinks) return;
    
    userSettings.links.push({name: name, href: url});
    saveSettings(userSettings);
});


document.getElementById('btnDownloadZwoFile').addEventListener('click', function() {
    var xml = createXmlString();
    var blob = new Blob([xml], {type: "application/xml"});
    var fileName = getName().replace(/[^A-Z0-9]/ig, '_') + '.zwo';;
    saveAs(blob, fileName);
});


document.getElementById('divSegmentChart').addEventListener('dragenter', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.classList.add('dragover');
}, false);


document.getElementById('divSegmentChart').addEventListener('dragleave', function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('dragover');
}, false);


document.getElementById('divSegmentChart').addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
}, false);


document.getElementById('divSegmentChart').addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('dragover');
    var files = e.dataTransfer.files; 
    if (files.length != 1) return;
    if (files[0].name.toLowerCase().indexOf('.zwo') != files[0].name.length - 4) return;

    var reader = new FileReader();
    reader.onload = function(event) {
        var xml = event.target.result;
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(xml, "text/xml");
        document.getElementById('txtName').value = xmlDoc.getElementsByTagName('name')[0].childNodes[0].nodeValue;
        document.getElementById('txtAuthor').value = xmlDoc.getElementsByTagName('author')[0].childNodes[0].nodeValue;
        document.getElementById('txtDescription').value = xmlDoc.getElementsByTagName('description')[0].childNodes[0].nodeValue;
        document.getElementById('txtTags').value = '';

        var tags = xmlDoc.getElementsByTagName('tag');
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].nodeType != 1) continue;
            document.getElementById('txtTags').value += tags[i].getAttribute('name') + ' ';
        }

        document.getElementById('divSegmentChart').innerHTML = '';
        var segments = xmlDoc.getElementsByTagName('workout')[0].childNodes;
        var workoutString = '';
        for (var i = 0; i < segments.length; i++) {
            if (segments[i].nodeType != 1) continue;
            var segmentType = segments[i].tagName.toLowerCase().charAt(0);
            switch (segmentType) {
                case "s":
                    workoutString += 's';
                    var p1 = getIntOrDefault(100*segments[i].getAttribute('Power'), 5);
                    var d1 = getIntOrDefault(segments[i].getAttribute('Duration'), 5);
                    workoutString += '-' + p1;
                    workoutString += '-' + d1;
                    workoutString += '!';
                    break;
                case "w":
                case "c":
                case "r":
                    workoutString += segmentType;
                    var p1 = getIntOrDefault(100*segments[i].getAttribute('PowerLow'), 5);
                    var d1 = getIntOrDefault(segments[i].getAttribute('Duration'), 5);
                    var p2 = getIntOrDefault(100*segments[i].getAttribute('PowerHigh'), 5);
                    workoutString += '-' + p1;
                    workoutString += '-' + d1;
                    workoutString += '-' + p2;
                    workoutString += '!';
                    break;
                case "f":
                    workoutString += 'f';
                    var d1 = getIntOrDefault(segments[i].getAttribute('Duration'), 5);
                    workoutString += '-' + d1;
                    workoutString += '!';
                    break;
                case "i":
                    workoutString += 'i';
                    var p1 = getIntOrDefault(100*segments[i].getAttribute('OnPower'), 5);
                    var d1 = getIntOrDefault(segments[i].getAttribute('OnDuration'), 5);
                    var p2 = getIntOrDefault(100*segments[i].getAttribute('OffPower'), 5);
                    var d2 = getIntOrDefault(segments[i].getAttribute('OffDuration'), 5);
                    var r = getIntOrDefault(segments[i].getAttribute('Repeat'), 1);
                    workoutString += '-' + p1;
                    workoutString += '-' + d1;
                    workoutString += '-' + p2;
                    workoutString += '-' + d2;
                    workoutString += '-' + r;
                    workoutString += '!';
                    break;
            }
        }
        
        loadWorkout(workoutString);
    };
    reader.readAsText(files[0]);
}, false);


function loadSegment(segmentId) {
    var txtR = document.getElementById('txtR');
    var txtD1 = document.getElementById('txtD1');
    var txtP1 = document.getElementById('txtP1');
    var txtD2 = document.getElementById('txtD2');
    var txtP2 = document.getElementById('txtP2');
    var chkCadence = document.getElementById('chkCadence');
    var txtC1 = document.getElementById('txtC1');
    var txtC2 = document.getElementById('txtC2');
    var divTexts = document.getElementById('divTextEvents');
    var btnAddTextEvent = document.getElementById('btnAddTextEvent');
    var selected = currentWorkout.segments.find(s => s.id === segmentId);
    
    if (selected.r) { txtR.value = selected.r; txtR.removeAttribute('disabled'); txtR.select(); } else { txtR.value = ''; txtR.setAttribute('disabled', true); }
    if (selected.d2) { txtD2.value = selected.d2; txtD2.removeAttribute('disabled'); txtD2.select(); } else { txtD2.value = ''; txtD2.setAttribute('disabled', true); }
    if (selected.p2) { txtP2.value = selected.p2; txtP2.removeAttribute('disabled'); txtP2.select() } else { txtP2.value = ''; txtP2.setAttribute('disabled', true); }
    if (selected.d1) { txtD1.value = selected.d1; txtD1.removeAttribute('disabled'); txtD1.select(); } else { txtD1.value = ''; txtD1.setAttribute('disabled', true); }
    if (selected.p1) { txtP1.value = selected.p1; txtP1.removeAttribute('disabled'); txtP1.select(); } else { txtP1.value = ''; txtP1.setAttribute('disabled', true); }
    if (selected.c1) { txtC1.value = selected.c1; txtC1.removeAttribute('disabled'); chkCadence.checked = true; } else { txtC1.value = ''; txtC1.setAttribute('disabled', true); chkCadence.checked = false;  }
    if (selected.c2) { txtC2.value = selected.c2; txtC2.removeAttribute('disabled'); } else { txtC2.value = ''; txtC2.setAttribute('disabled', true); }

    divTexts.innerHTML = '';
    for (var i = 0; i < selected.textEvents.length; i++) {
        addTextEventControls(selected.textEvents[i]);
    }
}


function showModal(id) {
    var overlay = document.createElement('div');
    overlay.setAttribute('class', 'overlay');
    document.body.appendChild(overlay);
    document.getElementById(id).classList.add('shown');
}


function dismissModal() {
    var modal = document.querySelector('.modal.shown');
    modal.classList.remove('shown');
    var overlay = document.querySelector('.overlay');
    overlay.parentNode.removeChild(overlay);
}


function addTextEventControls(textEvent) {
    var clone = document.getElementById('divTextEventToClone').cloneNode(true);
    clone.classList.remove('invisible');
    document.getElementById('divTextEvents').appendChild(clone);
    var childNodes = document.getElementById('divTextEvents').childNodes;
    var addedElement = childNodes[childNodes.length-1];
    addedElement.setAttribute('id', textEvent.id);
    addedElement.querySelector('input').value = textEvent.text;
    addedElement.querySelector('input[type=number]').value = textEvent.offset;
    addedElement.querySelector('input').select();
}
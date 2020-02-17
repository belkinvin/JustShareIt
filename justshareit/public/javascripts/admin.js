(function() {

    /* Connect using socket */
    const socket = io().connect();
    
    let files = {};

    /* Emit create */
    socket.emit('create');

    /* Send request to get files list */
    socket.emit('get files');

    /* Alert message when file has already been transfered */
    socket.on('already transfered', function () {
        alert("File already transfered!");
    });

    /* Initialize file-upload */
    function Init() {
		var fileSelect = document.getElementById('file-upload'),
			fileDrag = document.getElementById('file-drag');

		fileSelect.addEventListener('change', fileSelectHandler, false);

		// File Drop
        fileDrag.addEventListener('dragover', fileDragHover, false);
        fileDrag.addEventListener('dragleave', fileDragHover, false);
        fileDrag.addEventListener('drop', fileSelectHandler, false);
	}

    /* Parse Uploaded File */
    function parseFile(file, offSet, callback) {
        var fileSize   = file.size;
        var chunkSize  = 20000 * 1024; // bytes
        var offset     = offSet;
        var chunkReaderBlock = null;
        
        /* Read File */
        var readEventHandler = function(evt) {
            if (evt.target.error == null && evt.target.result.byteLength) {
                offset += evt.target.result.byteLength;
                callback(evt.target.result, file.name, file.type, file.size, offset); // callback for handling read chunk
            } else {
                console.log("Read error: " + evt.target.error);
                return;
            }
            if (offset >= fileSize) {
                console.log("Done reading file");
                return;
            }

            /* Read next chunk */
            // chunkReaderBlock(offset, chunkSize, file);
        }

        /* Read Chunk */
        chunkReaderBlock = function(_offset, length, _file) {
            let r = new FileReader();
            var blob = _file.slice(_offset, length + _offset);
            r.onload = readEventHandler;
            r.readAsArrayBuffer(blob);
        }

        /* Start the read with the first block */
        chunkReaderBlock(offset, chunkSize, file);
    }

    function fileDragHover(e) {
        var fileDrag = document.getElementById('file-drag');

        e.stopPropagation();
        e.preventDefault();
        
        fileDrag.className = (e.type === 'dragover' ? 'hover' : 'modal-body file-upload');
	}

    /* File upload handler */
	async function fileSelectHandler(e) {
		// Cancel event and hover styling
		fileDragHover(e);
		
		// Process all File objects
		for(let i=0; i<e.target.files.length; i++) {
            let file = e.target.files[i];
            
            if(!files[file.name]) {
                files[file.name] = file
            }

			parseFile(file, 0, function (data, filename, filetype, filesize, newOffSet) {
		
				/* send slice to socket server */
				socket.emit('slice', {
					name: filename,
					type: filetype, 
					size: filesize, 
					data: data,
                    currentSize: data.byteLength,
                    offset: newOffSet
				});
			
			});
            /* Add file to dashboard */
			parseOutput(file.name, file.size);
		}
    }
    
    socket.on('request slice', function(filename, offset) {
        
        console.log("Slice Requested with offset " + offset.toString());

        parseFile(files[filename], offset, function (data, filename, filetype, filesize, newOffSet) {
		
            /* send slice to socket server */
            socket.emit('slice', {
                name: filename,
                type: filetype, 
                size: filesize, 
                data: data,
                currentSize: data.byteLength,
                offset: newOffSet
            });
            // console.log("Slice Emitted with offset " + newOffSet.toString());
            console.log("Size " + filesize.toString() + " offset " + offset.toString());
        
        });
    });

    /* Add file description to dashboard */
	function parseOutput(filename, filesize) {
        /* File description template */
		var html = `
        <div class="col-md-6 mb-4" style="min-width:100%;">
            <div class="card border-left-primary py-2">
                <div class="card-body">
                    <div class="row align-items-center no-gutters">
                        <div class="col mr-2">
                            <div class="text-dark font-weight-bold h5 mb-0">
                                <span>` + filename + `</span>
                            </div>
                        </div>
                        <div class="col mr-2" style="text-align:right">
                            <div class="text-dark font-weight-bold h5 mb-0">
                                <span>` + (filesize / (1024 * 1024)).toFixed(2) + `&nbsp MB </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        html = $.parseHTML( html);
        
        /* Add file description to dashboard */
        $("#file-zone").append(html);
        
        /* Increment received files & data */
        var received = parseFloat(document.getElementById("received").innerHTML) + parseFloat((filesize / (1024 * 1024)).toFixed(2));
        document.getElementById("received").innerHTML = received;

        document.getElementById("files").innerHTML = parseInt(document.getElementById("files").innerHTML)+1;
    }
    
    /* On receiving shared file list display them on dashboard */
    socket.on('shared files', function (files) {
        for(var file in files) {
            parseOutput(file, files[file]);
        }
    });
	    
    /* Check for the various File API support. */
    if (window.File && window.FileList && window.FileReader) {
        Init();
    } else {
        document.getElementById('file-drag').style.display = 'none';
    }

})();

/* Approve user request */
function approveVisiter(visiterName) {
    var settings = {
      "async": false,
      "crossDomain": true,
      "method": "POST",
      "url": "/JustShareIt/admin/approve",
      "data": {"username": visiterName},
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache"
      }
    }
  
    $.ajax(settings).done(function (response) {
      alert("User Approved!");
      /* Reload page */
      location.reload();
      return false;
    });
}

/* Reject user request */
function rejectVisiter(visiterName, token) {
    var settings = {
      "async": false,
      "crossDomain": true,
      "method": "POST",
      "url": "/JustShareIt/admin/reject",
      "data": {"username": visiterName},
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache"
      }
    }
  
    $.ajax(settings).done(function (response) {
      alert("User Rejected!");
      return false;
    });
}
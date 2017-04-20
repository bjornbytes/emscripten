var LibraryWebVR = {
  $WebVR: {
    initialized: false,
    display: null,
    canvas: null,
    render: null,
    renderData: null,
    width: 0,
    height: 0,
    frame: null,
    viewMatrix: null,
    projectionMatrix: null,

    init: function() {
      if (WebVR.initialized) {
        return;
      }

      WebVR.initialized = true;

      if (!navigator.getVRDisplays) {
        console.log('WebVR is not supported');
        return;
      }

      WebVR.canvas = document.querySelector('#canvas');
      WebVR.frame = new VRFrameData();
      WebVR.viewMatrix = Module._malloc(64);
      WebVR.projectionMatrix = Module._malloc(64);

      navigator.getVRDisplays().then(function(displays) {
        var display = WebVR.display = displays[0];

        if (!display) {
          console.log('No displays found');
          return;
        }

        document.onkeypress = function(event) {
          if (event.charCode != 102) {
            return;
          }

          display.requestPresent([{ source: canvas }]).then(function() {
            var render = function() {
              if (display && display.isPresenting) {
                display.requestAnimationFrame(render);

                display.getFrameData(WebVR.frame);

                if (WebVR.render) {
                  Runtime.dynCall('vi', WebVR.render, [WebVR.renderData]);
                }

                display.submitFrame();
              }
            };

            display.requestAnimationFrame(render);
          });
        };
      });

      window.addEventListener('vrdisplaypresentchange', function() {
        if (WebVR.display && WebVR.display.isPresenting) {
          var eyeParams = WebVR.display.getEyeParameters('left');
          canvas.width = WebVR.width = eyeParams.renderWidth * 2;
          canvas.height = WebVR.height = eyeParams.renderHeight;
        }
      });
    }
  },

  emscripten_vr_init: function() {
    WebVR.init();
  },

  emscripten_vr_is_present: function() {
    return WebVR.display !== null;
  },

  emscripten_vr_set_render_callback: function(callback, data) {
    WebVR.render = callback;
    WebVR.renderData = data;
  },

  emscripten_vr_get_display_width: function() {
    return WebVR.width;
  },

  emscripten_vr_get_display_height: function() {
    return WebVR.height;
  },

  emscripten_vr_get_view_matrix: function(eye) {
    if (!WebVR.frame) {
      return;
    }

    HEAPF32.set(new Float32Array(eye === 0 ? WebVR.frame.leftViewMatrix : WebVR.frame.rightViewMatrix), WebVR.viewMatrix / 4);

    return WebVR.viewMatrix;
  },

  emscripten_vr_get_projection_matrix: function(eye) {
    if (!WebVR.frame) {
      return;
    }

    HEAPF32.set(new Float32Array(eye === 0 ? WebVR.frame.leftProjectionMatrix : WebVR.frame.rightProjectionMatrix), WebVR.projectionMatrix / 4);

    return WebVR.projectionMatrix;
  }
};

autoAddDeps(LibraryWebVR, '$WebVR');
mergeInto(LibraryManager.library, LibraryWebVR);

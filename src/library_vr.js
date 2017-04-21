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
    return WebVR.display && WebVR.display.isConnected;
  },

  emscripten_vr_get_display_name: function() {
    if (!WebVR.display) {
      return 0;
    }

    if (WebVR.displayName) {
      return WebVR.displayName;
    }

    var str = WebVR.display.displayName;
    var len = lengthBytesUTF8(str);

    WebVR.displayName = _malloc(len + 1);
    stringToUTF8(str, WebVR.displayName, len + 1);

    return WebVR.displayName;
  },

  emscripten_vr_get_display_width: function() {
    return WebVR.width;
  },

  emscripten_vr_get_display_height: function() {
    return WebVR.height;
  },

  emscripten_vr_get_display_clip_distance: function(near, far) {
    if (!WebVR.display) {
      Module.setValue(near, 0, 'float');
      Module.setValue(far, 0, 'float');
      return;
    }

    Module.setValue(near, WebVR.display.depthNear, 'float');
    Module.setValue(far, WebVR.display.depthFar, 'float');
  },

  emscripten_vr_set_display_clip_distance: function(near, far) {
    if (WebVR.display) {
      WebVR.display.depthNear = near;
      WebVR.display.depthFar = far;
    }
  },

  emscripten_vr_get_bounds_width: function() {
    var stage = WebVR.display && WebVR.display.stageParameters;
    return stage ? stage.sizeX : 0;
  },

  emscripten_vr_get_bounds_depth: function() {
    var stage = WebVR.display && WebVR.display.stageParameters;
    return stage ? stage.sizeZ : 0;
  },

  emscripten_vr_get_position: function(x, y, z) {
    if (!WebVR.display || !WebVR.frame) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.position[0], 'float');
    Module.setValue(y, WebVR.frame.pose.position[1], 'float');
    Module.setValue(z, WebVR.frame.pose.position[2], 'float');
  },

  emscripten_vr_get_eye_offset: function(eye, x, y, z) {
    if (!WebVR.display) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    var eyeParams = WebVR.display.getEyeParameters(eye === 0 ? 'left' : 'right');
    Module.setValue(x, eyeParams.offset[0], 'float');
    Module.setValue(y, eyeParams.offset[1], 'float');
    Module.setValue(z, eyeParams.offset[2], 'float');
  },

  emscripten_vr_get_orientation: function(x, y, z, w) {
    if (!WebVR.display || !WebVR.frame) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      Module.setValue(w, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.orientation[0], 'float');
    Module.setValue(y, WebVR.frame.pose.orientation[1], 'float');
    Module.setValue(z, WebVR.frame.pose.orientation[2], 'float');
    Module.setValue(w, WebVR.frame.pose.orientation[3], 'float');
  },

  emscripten_vr_get_velocity: function(x, y, z) {
    if (!WebVR.display || !WebVR.frame) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.linearVelocity[0], 'float');
    Module.setValue(y, WebVR.frame.pose.linearVelocity[1], 'float');
    Module.setValue(z, WebVR.frame.pose.linearVelocity[2], 'float');
  },

  emscripten_vr_get_angular_velocity: function(x, y, z) {
    if (!WebVR.display || !WebVR.frame) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.angularVelocity[0], 'float');
    Module.setValue(y, WebVR.frame.pose.angularVelocity[1], 'float');
    Module.setValue(z, WebVR.frame.pose.angularVelocity[2], 'float');
  },

  emscripten_vr_set_render_callback: function(callback, data) {
    WebVR.render = callback;
    WebVR.renderData = data;
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

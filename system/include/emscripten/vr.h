/* -*- Mode: c++; indent-tabs-mode: nil; tab-width: 40; c-basic-offset: 4 -*- */

#ifndef __emscripten_vr_h__
#define __emscripten_vr_h__

#include <stdint.h>
#include <stdbool.h>

/*
 * This file provides some basic interfaces for interacting with WebVR from Emscripten.
 *
 */

#ifdef __cplusplus
extern "C" {
#endif

extern void emscripten_vr_init();
extern int emscripten_vr_is_present();
extern void emscripten_vr_set_render_callback(em_arg_callback_func callback, void* data);
extern int emscripten_vr_get_display_width();
extern int emscripten_vr_get_display_height();
extern float* emscripten_vr_get_view_matrix(int eye);
extern float* emscripten_vr_get_projection_matrix(int eye);

#ifdef __cplusplus
} // ~extern "C"
#endif

#endif

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

extern void emscripten_vr_init(void);
extern int emscripten_vr_is_present(void);
extern const char* emscripten_vr_get_display_name(void);
extern int emscripten_vr_get_display_width(void);
extern int emscripten_vr_get_display_height(void);
extern void emscripten_vr_get_display_clip_distance(float* near, float* far);
extern void emscripten_vr_set_display_clip_distance(float near, float far);
extern float emscripten_vr_get_bounds_width(void);
extern float emscripten_vr_get_bounds_depth(void);
extern void emscripten_vr_get_position(float* x, float* y, float* z);
extern void emscripten_vr_get_eye_offset(int i, float* x, float* y, float* z);
extern void emscripten_vr_get_orientation(float* x, float* y, float* z, float* w);
extern void emscripten_vr_get_velocity(float* x, float* y, float* z);
extern void emscripten_vr_get_angular_velocity(float* x, float* y, float* z);
extern int emscripten_vr_get_controller_count(void);
extern int emscripten_vr_controller_is_present(int index);
extern int emscripten_vr_controller_get_hand(int index);
extern void emscripten_vr_get_controller_position(int index, float* x, float* y, float* z);
extern void emscripten_vr_get_controller_orientation(int index, float* x, float* y, float* z, float* w);
extern float emscripten_vr_controller_get_axis(int index, int axis);
extern int emscripten_vr_controller_is_down(int index, int button);
extern void emscripten_vr_controller_vibrate(int index, float duration, float power);
extern void emscripten_vr_set_render_callback(em_arg_callback_func callback, void* data);
extern float* emscripten_vr_get_view_matrix(int eye);
extern float* emscripten_vr_get_projection_matrix(int eye);
extern float* emscripten_vr_get_sitting_to_standing_matrix(void);
extern int emscripten_vr_has_stage(void);

#ifdef __cplusplus
} // ~extern "C"
#endif

#endif

import * as THREE from 'three';
import { EventsDispatcher } from '../utils/EventsDispatcher.js';
/*
export type Handedness = 'left' | 'right';
export type ButtonName = 'Trigger' | 'Grip' | 'Joystick' | 'ButtonX' | 'ButtonY' | 'ButtonA' | 'ButtonB';
type ButtonsMappingType = { left: ButtonName[]; right: ButtonName[] };
*/
const AXES_DEAD_ZONE = 0.4;
const HOLD_THRESHOLD = 0.5; // delta in x and y axis to consider the stick is being holded
const HOLDED_EVENT_INTERVAL = 0.75; // how often the stick holding events are dispatched
const STICK_CLICK_THRESHOLD = 400; // MSEC, is the threshold in seconds to consider that the stick has been clicked in any direcion

const buttonsMapping = {
    left: [
        /* 0 */ 'Trigger',
        /* 1 */ 'Grip',
        /* 2 */ null,
        /* 3 */ 'Joystick',
        /* 4 */ 'ButtonX',
        /* 5 */ 'ButtonY',
        /* 6 */ null,
        /* 7 */ null,
    ],
    right: [
        /* 0 */ 'Trigger',
        /* 1 */ 'Grip',
        /* 2 */ null,
        /* 3 */ 'Joystick',
        /* 4 */ 'ButtonA',
        /* 5 */ 'ButtonB',
        /* 6 */ null,
        /* 7 */ null,
    ],
};

// Tipos de eventos que despacha

export const EventTypes = {
    ON_BUTTON_UP: 1,
    ON_BUTTON_DOWN: 2,

    ON_AXIS_CHANGED: 3,
    ON_AXIS_X_HOLDED: 4, // is triggered every N seconds while the X axis of the stick is being hold away from (0,0)
    ON_AXIS_Y_HOLDED: 5, // same but for Y axis

    ON_AXIS_FORWARD_DOWN: 6,
    ON_AXIS_FORWARD_UP: 7,

    ON_AXIS_BACKWARD_DOWN: 8,
    ON_AXIS_BACKWARD_UP: 9,

    ON_AXIS_LEFT_DOWN: 10,
    ON_AXIS_LEFT_UP: 11,

    ON_AXIS_RIGHT_DOWN: 12,
    ON_AXIS_RIGHT_UP: 13,

    ON_AXIS_FORWARD_CLICK: 14, // a quick down and up event for the forward axis
    ON_AXIS_BACKWARD_CLICK: 15,
    ON_AXIS_LEFT_CLICK: 16,
    ON_AXIS_RIGHT_CLICK: 17,
};

/**
 * Source: https://stackoverflow.com/questions/62476426/webxr-controllers-for-button-pressing-in-three-js
 */

export class XRGamepadMonitor extends EventsDispatcher {
    buttonsState;
    axesPreviousState;
    handedness;
    xr;

    stickPosition = new THREE.Vector2();
    stickRawPosition = new THREE.Vector2();
    stickPreviousPosition = new THREE.Vector2();
    stickHoldingTimer = 0;

    stickXAxisActivatedAtTime = null;
    stickYAxisActivatedAtTime = null;

    forwardIsDown = false;
    backwardIsDown = false;
    leftIsDown = false;
    rightIsDown = false;

    axisXIsBeingHolded = false;
    axisYIsBeingHolded = false;

    constructor(xr, handedness) {
        super();
        this.xr = xr;
        this.handedness = handedness;
    }

    update(delta) {
        this.pollControllers(delta);
    }

    isDown(button) {
        if (!this.buttonsState) return false;

        const buttonIdx = buttonsMapping[this.handedness].findIndex((name) => name == button);

        if (buttonIdx < 0) return false;
        else return this.buttonsState[buttonIdx].pressed;
    }

    getButtonValue(button) {
        if (!this.buttonsState) return 0;
        const buttonIdx = buttonsMapping[this.handedness].findIndex((name) => name == button);

        if (buttonIdx < 0) return 0;
        else return this.buttonsState[buttonIdx].value;
    }

    xIsBeingHolded() {
        return this.axisXIsBeingHolded;
    }
    xIsAboveHoldThreshold() {
        return Math.abs(this.stickPosition.x) > HOLD_THRESHOLD;
    }

    yIsBeingHolded() {
        return this.axisYIsBeingHolded;
    }

    getStickPosition() {
        return this.stickPosition.clone();
    }

    pollControllers(delta) {
        let session = this.xr.getSession();
        if (!session) return;

        for (const source of session.inputSources) {
            if (source && source.handedness && source.handedness == this.handedness) {
                if (!source.gamepad) return;
                this.pollButtons(source.gamepad);
                this.pollAxes(source.gamepad, delta);
            }
        }
    }

    pollAxes(gamepad, delta) {
        if (gamepad.axes.length >= 4) {
            this.stickRawPosition = new THREE.Vector2(gamepad.axes[2], gamepad.axes[3]);
            this.stickPosition = this.applyDeadZone([gamepad.axes[2], gamepad.axes[3]]);

            if (this.stickPreviousPosition.distanceTo(this.stickPosition) > 0) {
                this.dispatchEvent({
                    type: EventTypes.ON_AXIS_CHANGED,
                    handedness: this.handedness,
                    position: this.stickPosition,
                    frameDelta: delta,
                });

                let eType = null;

                if (
                    Math.abs(this.stickPreviousPosition.y) < HOLD_THRESHOLD &&
                    Math.abs(this.stickPosition.y) > HOLD_THRESHOLD
                ) {
                    // Forward Down
                    if (this.stickPosition.y < 0 && !this.forwardIsDown) {
                        eType = EventTypes.ON_AXIS_FORWARD_DOWN;
                        this.forwardIsDown = true;
                        this.stickYAxisActivatedAtTime = performance.now();
                    }

                    // Backward Down
                    if (this.stickPosition.y > 0 && !this.backwardIsDown) {
                        eType = EventTypes.ON_AXIS_BACKWARD_DOWN;
                        this.backwardIsDown = true;
                        this.stickYAxisActivatedAtTime = performance.now();
                    }
                }

                if (Math.abs(this.stickPosition.y) < HOLD_THRESHOLD) {
                    let deltaTime = this.stickYAxisActivatedAtTime
                        ? performance.now() - this.stickYAxisActivatedAtTime
                        : Infinity;
                    // Forward Up
                    if (this.forwardIsDown) {
                        eType = EventTypes.ON_AXIS_FORWARD_UP;
                        this.forwardIsDown = false;
                        if (deltaTime < STICK_CLICK_THRESHOLD) {
                            this.dispatchEvent({
                                type: EventTypes.ON_AXIS_FORWARD_CLICK,
                            });
                        }
                    }
                    // Backward Up
                    if (this.backwardIsDown) {
                        eType = EventTypes.ON_AXIS_BACKWARD_UP;
                        this.backwardIsDown = false;
                        if (deltaTime < STICK_CLICK_THRESHOLD) {
                            this.dispatchEvent({
                                type: EventTypes.ON_AXIS_BACKWARD_CLICK,
                            });
                        }
                    }
                }

                // Axis X (horizontal)
                if (
                    Math.abs(this.stickPreviousPosition.x) < HOLD_THRESHOLD &&
                    Math.abs(this.stickPosition.x) > HOLD_THRESHOLD
                ) {
                    // Left Down
                    if (this.stickPosition.x < 0 && !this.leftIsDown) {
                        eType = EventTypes.ON_AXIS_LEFT_DOWN;
                        this.leftIsDown = true;
                        this.stickXAxisActivatedAtTime = performance.now();
                    }
                    // Right Down
                    if (this.stickPosition.x > 0 && !this.rightIsDown) {
                        eType = EventTypes.ON_AXIS_RIGHT_DOWN;
                        this.rightIsDown = true;
                        this.stickXAxisActivatedAtTime = performance.now();
                    }
                }
                if (Math.abs(this.stickPosition.x) < HOLD_THRESHOLD) {
                    let deltaTime = this.stickXAxisActivatedAtTime
                        ? performance.now() - this.stickXAxisActivatedAtTime
                        : Infinity;

                    // Left Up
                    if (this.leftIsDown) {
                        eType = EventTypes.ON_AXIS_LEFT_UP;
                        this.leftIsDown = false;
                        if (deltaTime < STICK_CLICK_THRESHOLD) {
                            this.dispatchEvent({
                                type: EventTypes.ON_AXIS_LEFT_CLICK,
                            });
                        }
                    }
                    // Right Up
                    if (this.rightIsDown) {
                        eType = EventTypes.ON_AXIS_RIGHT_UP;
                        this.rightIsDown = false;
                        if (deltaTime < STICK_CLICK_THRESHOLD) {
                            this.dispatchEvent({
                                type: EventTypes.ON_AXIS_RIGHT_CLICK,
                            });
                        }
                    }
                }

                if (eType) {
                    this.dispatchEvent({
                        type: eType,
                        handedness: this.handedness,
                        position: this.stickPosition,
                        frameDelta: delta,
                    });
                }
            }
            this.checkStickHolding(delta);
            this.stickPreviousPosition.copy(this.stickPosition);
        }
    }

    checkStickHolding(delta) {
        if (this.stickPosition.length() > 0 && this.stickHoldingTimer <= 0) {
            // if the holding timer reached 0, is time to check the state of X and Y axes

            if (Math.abs(this.stickRawPosition.x) > HOLD_THRESHOLD) {
                // dispatch AXIS_X_HOLDED event every HOLDED_EVENT_INTERVAL seconds
                this.axisXIsBeingHolded = true;
                this.dispatchEvent({
                    type: EventTypes.ON_AXIS_X_HOLDED,
                    handedness: this.handedness,
                    value: this.stickPosition.x,
                });
            } else {
                this.axisXIsBeingHolded = false;
            }

            if (Math.abs(this.stickPosition.y) > HOLD_THRESHOLD) {
                // dispatch AXIS_Y_HOLDED event every HOLDED_EVENT_INTERVAL seconds
                this.axisYIsBeingHolded = true;
                this.dispatchEvent({
                    type: EventTypes.ON_AXIS_Y_HOLDED,
                    handedness: this.handedness,
                    value: this.stickPosition.y,
                });
            } else {
                this.axisYIsBeingHolded = false;
            }

            this.restartHoldingTimer();
        } else {
            // no time to dispatch events yet
            this.stickHoldingTimer = Math.max(0, this.stickHoldingTimer - delta); // decrease timer value
        }
    }

    restartHoldingTimer() {
        this.stickHoldingTimer = HOLDED_EVENT_INTERVAL; // re set the timer to HOLDED_EVENT_INTERVAL
    }

    applyDeadZone(values) {
        /*
          for each component of values, if abs(x)<AXES_DEAD_ZONE x=0
    
        */
        values.map((value) => {
            let x;
            if (value < 0) x = Math.min(0, value + AXES_DEAD_ZONE);
            else x = Math.max(0, value - AXES_DEAD_ZONE);
            return x;
        });
        return new THREE.Vector2(values[0], values[1]);
    }

    pollButtons(gamepad) {
        const previousState = this.buttonsState;
        const newState = gamepad.buttons.map((b) => ({
            pressed: b.pressed,
            value: b.value,
        }));

        if (!previousState) {
            // First frame
            this.buttonsState = newState;
            return;
        }

        newState.forEach((state, i) => {
            // Check if button was pressed on this frame
            if (previousState[i].pressed === false && state.pressed === true) {
                this.dispatchEvent({
                    type: EventTypes.ON_BUTTON_DOWN,
                    index: i,
                    button: buttonsMapping[this.handedness][i],
                    handedness: this.handedness,
                });
            }

            // Check if button was released on this frame
            if (previousState[i].pressed === true && state.pressed === false) {
                this.dispatchEvent({
                    type: EventTypes.ON_BUTTON_UP,
                    index: i,
                    button: buttonsMapping[this.handedness][i],
                    handedness: this.handedness,
                });
            }
        });

        this.buttonsState = newState;
    }
}

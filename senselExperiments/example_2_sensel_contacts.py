#!/usr/bin/env python

##########################################################################
# MIT License
#
# Copyright (c) 2013-2017 Sensel, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
# to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or
# substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
# PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
# FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
# OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.
##########################################################################

import sys
sys.path.append('../../sensel-lib-wrappers/sensel-lib-python')
import sensel
import binascii
import threading
import OSC

oscClient = OSC.OSCClient()
oscClient.connect(("127.0.0.1", 7501))

enter_pressed = False;

def waitForEnter():
    global enter_pressed
    raw_input("Press Enter to exit...")
    enter_pressed = True
    return

def openSensel():
    handle = None
    (error, device_list) = sensel.getDeviceList()
    print "num devices", device_list.num_devices
    if device_list.num_devices != 0:
        (error, handle) = sensel.openDeviceByID(device_list.devices[0].idx)
    return handle

def initFrame():
    error = sensel.setFrameContent(handle, sensel.FRAME_CONTENT_CONTACTS_MASK)
    (error, frame) = sensel.allocateFrameData(handle)
    error = sensel.startScanning(handle)
    return frame

def scanFrames(frame, info):
    error = sensel.readSensor(handle)
    (error, num_frames) = sensel.getNumAvailableFrames(handle)
    for i in range(num_frames):
        error = sensel.getFrame(handle, frame)
        printFrame(frame,info)

def ae_snakeMessage(frame, info):
    msg = OSC.OSCMessage()
    msg.setAddress("/snakeTouch")
    if frame.n_contacts > 0:
        c = frame.contacts[0]
        msg.append([c.x_pos, c.y_pos])
        oscClient.send(msg)



def printFrame(frame, info):
    msg = OSC.OSCMessage()
    msg.setAddress("/senselDraw")
    msg.append(frame.n_contacts)
    if frame.n_contacts > 0:
        # print "\nNum Contacts: ", frame.n_contacts
        for n in range(frame.n_contacts):
            c = frame.contacts[n]
            # print "Contact ID: ", c.id, c.x_pos, c.y_pos, c.total_force
            msg.append([c.id, c.x_pos, c.y_pos, c.total_force])
            if c.state == sensel.CONTACT_START:
                sensel.setLEDBrightness(handle, c.id, 100)
            elif c.state == sensel.CONTACT_END:
                sensel.setLEDBrightness(handle, c.id, 0)
    oscClient.send(msg)
    ae_snakeMessage(frame, info)

def closeSensel(frame):
    error = sensel.freeFrameData(handle, frame)
    error = sensel.stopScanning(handle)
    error = sensel.close(handle)

if __name__ == "__main__":
    global enter_pressed
    handle = openSensel()
    if handle != None:
        (error, info) = sensel.getSensorInfo(handle)
        frame = initFrame()

        t = threading.Thread(target=waitForEnter)
        t.start()
        while(enter_pressed == False):
            scanFrames(frame, info)
        print "enter was pressed"
        closeSensel(frame)
    print "no handle"
    

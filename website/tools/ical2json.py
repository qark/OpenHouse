#!/usr/bin/python
import hashlib
import json
import os
import sys
import time
import vobject
import urllib
import urllib2

ICAL_URL = "http://redhatopenhouse.shdlr.com/ical"

def convertDate(text):
    t = time.strptime(text, "%Y-%m-%d %H:%M:%S")
    return int(time.mktime(t))

def parseDescription(text):
    print "To parse <%s>" % text
    # skip " by " prefix
    assert text.startswith(" by ")
    text = text[4:]
    speaker, text = text.split(" at ")
    location, text = text.split(" floor ")
    location += " floor"
    room, tags = text.split(" [")
    tags = tags.rstrip("]")
    print "Return: <%s> <%s> <%s> <%s>" % (speaker, location, room, tags)
    return speaker, location, room, tags.split(",")

def schedule2json(inp, timestamp):
    result = list()
    date = None
    rooms = None
    topics = dict()
    hash = hashlib.sha256(inp)
    for record in vobject.readOne(inp).components():
        print 80 * "-"
        print "IN:", record
        if record.name != "VEVENT":
            continue
        speaker, location, room, tags = parseDescription(record.description.value[len(record.summary.value):])
        output = dict()
        output["type"] = "talk"
        output["date"] = record.dtstart.value.strftime("%Y-%m-%d")
        output["start"] = record.dtstart.value.strftime("%H:%M")
        output["end"] = record.dtend.value.strftime("%H:%M")
        output["room"] = room
        output["speaker"] = speaker
        output["topic"] = record.summary.value
        output["description"] = "N/A"
        output["tags"] = tags
        output["location"] = location
        output["timestamp"] = convertDate(record.dtstart.value.strftime("%Y-%m-%d %H:%M:%S"))
        output["timestamp_end"] = convertDate(record.dtend.value.strftime("%Y-%m-%d %H:%M:%S"))
        output["language"] = "CZ"
        print
        print "OUT:", output
        result.append(output)
    # sort schedule by timestamp (primary key) and room name (secondary key)
    result.sort(key = lambda a: a["room"])
    result.sort(key = lambda a: a["timestamp"])
    return dict(items = result, timestamp = timestamp, checksum = hash.hexdigest())

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print >>sys.stderr, "Dirname expected"
        sys.exit(1)
    outDir = sys.argv[1]
    
    # convert schedule to json
    schedule = urllib2.urlopen(ICAL_URL).read()
    timestamp = int(time.time())
    data = schedule2json(schedule, timestamp)
    
    try:
        old = json.load(open(os.path.join(outDir, "schedule.json"), "r"))
    except IOError:
        old = dict(checksum = None)
    
    print 80 * "-"
    if old["checksum"] != data["checksum"] or True:
        print "Updading JSON files"
        # update schedule and timestamp
        open(os.path.join(outDir, "schedule.json"), "w").write(json.dumps(data))
    
        # write timestamp
        open(os.path.join(outDir, "schedule-ts.json"), "w").write(json.dumps(timestamp))

        # write checksum
        open(os.path.join(outDir, "schedule-cksum.json"), "w").write(json.dumps(data["checksum"]))

    else:
        print "NOT updating JSON files"

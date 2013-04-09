.PHONY: run all sync sync-people mobileweb/schedule.json mobileweb/schedule.xml

all: mobileweb/schedule.json mobileweb/schedule-ts.json mobileweb/schedule.xml

mobileweb/schedule.json: tools/schedule2json.py
	tools/ical2json.py mobileweb/
	tools/ical2json.py dashboard/

#mobileweb/schedule.xml:
#	tools/devconf_schedule.py mobileweb/schedule.json > mobileweb/schedule.xml
	
run-dashboard :
	@cd dashboard ; python -m SimpleHTTPServer

run-mobileweb :
	@cd mobileweb ; python -m SimpleHTTPServer

sync:
	rsync -av --delete dashboard/ lsmid@people.redhat.com:public_html/openhouse/dashboard
	rsync -av --delete mobileweb/ lsmid@people.redhat.com:public_html/openhouse/mobileweb


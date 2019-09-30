"""
Simple Python script to generate an NLP training set from Facebook posts

This script takes a simplified listing of Facebook posts and generates
some rows of JSON data suitable for use as a training set by the 
cakechat bot:
  https://github.com/lukalabs/cakechat.git

Each row of data supplied to cakechat should be a JSON-formatted
array of dictionaries, each of which represents a single line of dialogue
in a conversation. The line of dialogue has two properties: the text
of the utterance, and the "condition," which represents a mood that
can have values of neutral, anger, joy, fear or sadness.
"""

import sys
import json
from nltk import sent_tokenize

text = sys.stdin.read()
simplified = json.loads(text)
for post in simplified:
	sentences = sent_tokenize(post['post'])
	trigger = False
	dialog = [{'text': "What's up?", "condition": "neutral"}]
	for sentence in sentences:
		dialog.append({'text': sentence, "condition": "neutral"})
		if trigger:
			print(json.dumps(dialog))
			dialog = [{'text': sentence, "condition": "neutral"}]
			trigger = False
			# count += 1
		else:
			trigger = True
	if trigger:
		print(json.dumps(dialog))

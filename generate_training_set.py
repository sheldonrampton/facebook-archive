import sys
import json
# import nltk
from nltk import sent_tokenize

text = sys.stdin.read()
simplified = json.loads(text)
# count = 0
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
		# count += 1

# print(count)

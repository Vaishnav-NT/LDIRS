from transformers import AutoModelForQuestionAnswering, AutoTokenizer, pipeline
import sys

model_name = "deepset/roberta-base-squad2"
model = AutoModelForQuestionAnswering.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Get predictions
nlp = pipeline('question-answering', model=model, tokenizer=tokenizer)
QA_input = {
    'question': sys.argv[1],
    'context': sys.argv[2],
}
res = nlp(QA_input)
print(res["answer"])

# import sys
# import requests

# API_TOKEN = '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'
# #API_URL = "https://api-inference.huggingface.co/models/bert-large-uncased-whole-word-masking-finetuned-squad"
# API_URL = "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2"
# headers = {"Authorization": f"Bearer {API_TOKEN}"}

# def query(payload):
# 	response = requests.post(API_URL, headers=headers, json=payload)
# 	return response.json()
	
# res = query({
# 	"inputs": {
# 		"question": sys.argv[1],
# 		"context": sys.argv[2]
# 	},
# 	"options": {
# 		"wait_for_model": "true",
# 		"use_cache": "false",
# 	},
# })

# print(res['answer'])
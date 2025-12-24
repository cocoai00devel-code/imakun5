import sys
import whisper

model = whisper.load_model("tiny")
# model = whisper.load_model("small")  # tiny / base / small / medium / large
result = model.transcribe(sys.argv[1], language="ja")
print(result["text"])

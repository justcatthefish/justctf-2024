How to run "remote" version
```
# build
docker build -t jctf_pwndbe_me -f ./Dockerfile .

# run
docker run --network none --rm -e FLAG="ctf{fake_flag}" -i jctf_pwndbe_me
```

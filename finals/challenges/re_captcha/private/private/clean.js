
        var canvas = window.document.getElementById('drawingCanvas');
        var ctx = canvas.getContext('2d');
        var xd = window.eval("Array(1040400).fill(0).map(a=>~~(100 + (156*Math.random())))")
        var imageData = new window.ImageData(new Uint8ClampedArray(xd), 510, 510)
        ctx.putImageData(imageData, 0, 0);
        var output = ""
        var text = window.document.getElementById("output");
        var num = 0;
        text.innerText = "SELECT ALL HYDRANTS 0/5"

        function drawCircle(x, y) {
            const radius = 10;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'red'; 
            ctx.fill();
            ctx.stroke(); 
        }

        var input;
        var rngs = 0;

        function validate(inp) {
            function rng() {
                rngs = ((rngs * 6563) + 5147) % 7919;
                return 0.5 - (rngs/7919)
            }
            var hash = 0;
            var inputxd = []
            for(var i = 0; i < 24; i++) {
                inputxd.push(inp.charCodeAt(i))
            }
            for(var k = 0; k != 5; k++) {
                var bits = []
                var lastChar = 0;
                for(var i = 0; i < 24; i++) {

                    hash = ((hash^17)*11)%256;

                    var char = inputxd[i];
                    for(var s = 0; s != 5; s++) {
                        char = (char + (s*13))%256;
                        char = char ^ hash ^ lastChar
                    }

                    for(var j = 0; j < 8; j++) {
                        bits.push(1 & (char >> j))
                    }
                    lastChar = char;
                }
                bits.sort(rng)
                
                for(var i = 0; i < 24; i++) {
                    var num = 0;
                    for(var j = 0; j < 8; j++) {
                        num = num | (bits.pop() << j)
                    }
                    inputxd[i] = num
                }
            }
            return inputxd
        }
        canvas.addEventListener('click', function(event) {
            const rect = canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            x = window.Math.max(30,Math.min(x,480))
            y = window.Math.max(30,Math.min(y,480))
            x = window.Math.round(x/30)*30
            y = window.Math.round(y/30)*30
            drawCircle(x, y);
            var input = ((x/30)-1) + '-' + ((y/30)-1);
            if(input == '1-15') {
                output += 'a9467921';
            } else if(input == '10-4') {
                output += 'de6d0194';
            } else if(input == '13-4') {
                output += 'ba66015b';
            } else if(input == '8-11') {
                output += '2b11509b';
            } else if(input == '3-11') {
                output += 'a5fcaf06';
            } else if(input == '9-7') {
                output += '8e653faa';
            } else if(input == '3-5') {
                output += '5cfc514c';
            } else if(input == '5-13') {
                output += 'bbfe5d3a';
            } else if(input == '14-11') {
                output += '2b18deb3';
            } else if(input == '10-5') {
                output += '2f08a2a3';
            } else if(input == '15-6') {
                output += '43c1c0f3';
            } else if(input == '6-9') {
                output += '9a207d59';
            } else if(input == '15-5') {
                output += '6dec0f88';
            } else if(input == '13-10') {
                output += '9351bc46';
            } else if(input == '5-4') {
                output += '31e2af9e';
            } else if(input == '7-10') {
                output += 'f3d0640a';
            } else if(input == '6-10') {
                output += 'b1bb6c87';
            } else if(input == '7-1') {
                output += '51910d51';
            } else if(input == '4-1') {
                output += 'b1ce7362';
            } else if(input == '2-0') {
                output += '9ac2912a';
            } else if(input == '5-15') {
                output += '40a6c695';
            } else if(input == '1-2') {
                output += 'a6b06b2d';
            } else if(input == '15-7') {
                output += 'b4cb5190';
            } else if(input == '7-5') {
                output += '5fb445c9';
            } else if(input == '6-6') {
                output += 'bb6084ed';
            } else if(input == '8-15') {
                output += '3f999a07';
            } else if(input == '9-2') {
                output += '75e92333';
            } else if(input == '0-13') {
                output += '38a93fbb';
            } else if(input == '2-11') {
                output += '3b426026';
            } else if(input == '0-8') {
                output += 'cd372c5f';
            } else if(input == '14-12') {
                output += 'e571e916';
            } else if(input == '10-15') {
                output += 'acea6a7c';
            } else if(input == '15-0') {
                output += '21e406e4';
            } else if(input == '3-8') {
                output += '35d4a4a4';
            } else if(input == '11-0') {
                output += '799591ed';
            } else if(input == '11-4') {
                output += '7e5cd0f4';
            } else if(input == '4-13') {
                output += 'ae786f62';
            } else if(input == '2-13') {
                output += 'cd2c8a67';
            } else if(input == '10-0') {
                output += '2303faba';
            } else if(input == '0-10') {
                output += '814cc495';
            } else if(input == '5-1') {
                output += 'ff23d2d3';
            } else if(input == '4-11') {
                output += '8796e790';
            } else if(input == '12-6') {
                output += '7cb41ae7';
            } else if(input == '12-9') {
                output += 'e5fb78d2';
            } else if(input == '11-15') {
                output += 'f16e19c1';
            } else if(input == '1-0') {
                output += '34455c3f';
            } else if(input == '8-4') {
                output += '100f6312';
            } else if(input == '11-9') {
                output += '85461b6b';
            } else if(input == '5-12') {
                output += '275283fe';
            } else if(input == '0-1') {
                output += '818876b5';
            } else if(input == '14-15') {
                output += '3d4fccb8';
            } else if(input == '15-1') {
                output += 'a4add154';
            } else if(input == '13-12') {
                output += '1df3908c';
            } else if(input == '13-14') {
                output += 'e7cec87c';
            } else if(input == '1-1') {
                output += '569cbf72';
            } else if(input == '14-0') {
                output += '97a96573';
            } else if(input == '7-9') {
                output += '1d17a451';
            } else if(input == '8-13') {
                output += 'cb4f5ae9';
            } else if(input == '0-14') {
                output += 'f7a11c71';
            } else if(input == '9-15') {
                output += '1aa3256f';
            } else if(input == '2-5') {
                output += 'e6f4798e';
            } else if(input == '12-7') {
                output += '280061d0';
            } else if(input == '12-3') {
                output += '31367ca3';
            } else if(input == '9-13') {
                output += '9fb12ed2';
            } else {
                output += '6831b94b';
            }
            num++;
            // console.log(output)

            output = 'f7a11c71' + '6831b94b' + '3b426026' + 'a9467921' + '7cb41ae7'
            text.innerText = 'SELECT ALL THE HYDRANTS '+num+'/5'
            if(num == 5) {
                canvas.removeEventListener('click', arguments.callee)
                var out = validate(md5(output));
                var a = [203, 125, 248, 215, 212, 12, 174, 12, 18, 63, 115, 238, 186, 50, 83, 244, 145, 136, 154, 15, 38, 192, 177, 247];
                var b = [58, 188, 251, 112, 103, 117, 174, 108, 21, 54, 2, 19, 66, 98, 163, 105, 201, 216, 234, 151, 174, 134, 137, 8];

                for(var i = 0; i != 24; i++) {
                    out[i] = out[i] ^ a[i]
                }

                for(var i = 0; i != 24; i++) {
                    out[i] = out[i] ^ b[i]
                }
                if(out.reduce(function(a,b) { return a*b },1337) == "1337") {
                    var encrypted = validate(md5(output+":)")).join(",")
                    var pass = md5(encrypted) + md5(encrypted+"-2");
                    pass = pass.match(new RegExp("[0-9a-f]{2}","g")).map(function (a){ return parseInt(a, 16) })
                    var flag = [231, 2, 40, 114, 108, 79, 56, 59, 248, 58, 141, 70, 249, 57, 64, 22, 247, 218, 141, 212, 41, 98, 207, 145, 45, 148, 226, 121, 185, 241, 50, 146]
                    for(var i = 0; i < 32; i++) {
                        flag[i] = flag[i] ^ pass[i]
                    }
                    alert("SOLUTION CORRECT FLAG: " + String.fromCharCode.apply(null, flag))
                } else {
                    alert("CAPTCHA SOLUTION INCORRECT")
                }

            }
        });

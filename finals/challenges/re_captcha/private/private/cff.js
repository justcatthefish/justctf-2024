var esprima = require('esprima');
var escodegen = require('escodegen');
var fs = require('fs')

var AST = esprima.parseScript(fs.readFileSync("./localobf.js").toString())

var blocks = []

var id = 0;

function visitNodes(node) {
    if (typeof node != "object") return node


    for (var key in node) {
        node[key] = visitNodes(node[key])
    }

    if (node && (node.type == "FunctionExpression" || node.type == "ArrowFunctionExpression")) {

        var block;
        if (node.body.type == "BlockStatement") {
            block = traverse(node.body.body)
        } else {
            block = traverse([node.body])
        }

        block.key = [...crypto.getRandomValues(new Uint8Array(8))]
        blocks.push(block)

        return {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "r"
            },
            "arguments": [{
                "type": "Literal",
                "value": `BLOCK_ID_PLACEHOLDER_${block.id}`,
                "raw": "1"
            },
            {
                "type": "ArrayExpression",
                "elements": block.key.map(a => ({
                    "type": "Literal",
                    "value": a,
                    "raw": "4"
                }))
            }
        ]
        }
    }

    return node;
}

function traverse(nodes, next, breakBlock, continueBlock) {
    var block = { nodes: [], id: id++, next }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.type == "IfStatement") {

            var nextBlock = traverse(nodes.slice(i + 1, nodes.length), next, breakBlock, continueBlock)

            var consequent;
            if (node.consequent && node.consequent.type == "BlockStatement") {
                consequent = traverse(node.consequent.body, nextBlock.id, breakBlock, continueBlock)
            } else if (node.consequent) {
                consequent = traverse([node.consequent], nextBlock.id, breakBlock, continueBlock)
            } else {
                consequent = traverse([], nextBlock.id, breakBlock, continueBlock)
            }

            block.test = node.test
            block.consequent = consequent.id;


            var alternate;
            if (node.alternate && node.alternate.type == "BlockStatement") {
                alternate = traverse(node.alternate.body, nextBlock.id, breakBlock, continueBlock)
            } else if (node.alternate) {
                alternate = traverse([node.alternate], nextBlock.id, breakBlock, continueBlock)
            } else {
                alternate = traverse([], nextBlock.id, next, breakBlock, continueBlock)
            }

            block.alternate = alternate.id

            blocks.push(consequent)
            blocks.push(alternate)
            blocks.push(nextBlock)

            block.next = undefined

            return block

        }


        if (node.type == "ReturnStatement") {
          block.nodes.push(node.argument)
          return block

        }
        
        if (node.type == "ForStatement") {

            var nextBlock = traverse(nodes.slice(i + 1, nodes.length), next, breakBlock, continueBlock)

            var testBlock = traverse([], undefined, breakBlock, continueBlock)

            testBlock.test = node.test

            block.nodes.push(node.init)


            var updateBlock;
            if (node.update && node.update.type == "BlockStatement") {
                updateBlock = traverse(node.update.body, testBlock.id, breakBlock, continueBlock)

            } else {
                updateBlock = traverse(node.update ? [node.update] : [], testBlock.id, breakBlock, continueBlock)
            }



            var body;
            if (node.body && node.body.type == "BlockStatement") {
                body = traverse(node.body.body, updateBlock.id, nextBlock.id, updateBlock.id)
            } else if (node.body) {
                body = traverse([node.body], updateBlock.id, nextBlock.id, updateBlock.id)
            } else {
                body = traverse([], updateBlock.id, nextBlock.id, updateBlock.id)
            }

            testBlock.consequent = body.id
            testBlock.alternate = nextBlock.id


            blocks.push(body)
            blocks.push(updateBlock)
            blocks.push(testBlock)
            blocks.push(nextBlock)



            block.next = testBlock.id

            return block

        }



        block.nodes.push(node)
    }

    return block

}

visitNodes(AST.body)

var first = traverse(AST.body);

first.key = [...crypto.getRandomValues(new Uint8Array(8))]

blocks.push(first)


var newBlocks = []
for (var block of blocks) {
    newBlocks[block.id] = block
}

blocks = newBlocks

var max = blocks.length;
var shuffled = []

for(var i = 0 ;i < max; i++) {
  shuffled.push(i)
}

shuffled = shuffled.sort( () => .5 - Math.random() );

var newBlocks = []
for(var block of blocks) {
  if(block.id !== undefined) block.id = shuffled[block.id]
  if(block.next !== undefined) block.next = shuffled[block.next]
  if(block.consequent !== undefined) block.consequent = shuffled[block.consequent]
  if(block.alternate !== undefined) block.alternate = shuffled[block.alternate]
  
}

var newBlocks = []
for (var block of blocks) {
    newBlocks[block.id] = block
}

blocks = newBlocks




for (var block of blocks) {
    var body = block.nodes
    if (block.next !== undefined) {
        if (!blocks[block.next].key) {
            blocks[block.next].key = [...crypto.getRandomValues(new Uint8Array(8))]
        }
        body.push({
            "type": "ExpressionStatement",
            "expression": {
              "type": "AssignmentExpression",
              "operator": "=",
              "left": {
                "type": "ArrayPattern",
                "elements": [
                  {
                    "type": "Identifier",
                    "name": "o"
                  },
                  {
                    "type": "Identifier",
                    "name": "s"
                  }
                ]
              },
              "right": {
                "type": "ArrayExpression",
                "elements": [
                  {
                    "type": "Literal",
                    "value": block.next,
                    "raw": "1"
                  },
                  {
                    "type": "ArrayExpression",
                    "elements": blocks[block.next].key.map(a => ({
                        "type": "Literal",
                        "value": a,
                        "raw": "4"
                    }))
                }
                ]
              }
            }
          })
    } else if (block.test) {

        let key;
        var left = 0;
        if(block.test.type == "BinaryExpression") {
            if(block.test.operator == "==" || block.test.operator == "!=") {

                if(block.test.operator == "!=") {
                    block.test.operator = "==";
                    [block.consequent, block.alternate] = [block.alternate, block.consequent]
                }

                if(block.test.left.type == "Literal") {
                    left = 1;
                    key = md5(block.test.left.value.toString(), ":)", true).slice(0,8).split("").map(a=>a.charCodeAt(0))
                    block.test.left.value = md5(block.left.value.toString())
                    block.test.right = {
                        "type": "CallExpression",
                        "callee": {
                          "type": "Identifier",
                          "name": "md5"
                        },
                        "arguments": [
                            block.test.right
                        ]
                      }
                } else if(block.test.right.type == "Literal") {
                    key = md5(block.test.right.value.toString(), ":)", true).slice(0,8).split("").map(a=>a.charCodeAt(0))
                    block.test.right.value = md5(block.test.right.value.toString())
                    
                    block.test.left = {
                        "type": "CallExpression",
                        "callee": {
                          "type": "Identifier",
                          "name": "md5"
                        },
                        "arguments": [
                            block.test.left
                        ]
                      }
                     
                }
            }
        }

        


        if (!blocks[block.consequent].key) {
            blocks[block.consequent].key = key ?? [...crypto.getRandomValues(new Uint8Array(8))]
        }

        if (!blocks[block.alternate].key) {
            blocks[block.alternate].key =  [...crypto.getRandomValues(new Uint8Array(8))]
        }


        

        // console.log(key, block.test)

        body.push({
            "type": "ExpressionStatement",
            "expression": {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": {
                    "type": "ArrayPattern",
                    "elements": [
                        {
                            "type": "Identifier",
                            "name": "o"
                        },
                        {
                            "type": "Identifier",
                            "name": "s"
                        }
                    ]
                },
                "right": {
                    "type": "ConditionalExpression",
                    "test": block.test,
                    "consequent": {
                        "type": "ArrayExpression",
                        "elements": [
                          key ?                        ({
                            "type": "BinaryExpression",
                            "operator": "^",
                            "right": {
                                                    "type": "Literal",
                                                    "value": block.consequent^key[0],
                                                    "raw": "4"
                                                },
                            "left": {
                            "type": "MemberExpression",
                            "computed": true,
                            "property":{
                              "type": "Literal",
                              "value": 0,
                              "raw": "0"
                            },
                            "object": {
                                                    "type": "CallExpression",
                                                    "callee": {
                                                      "type": "MemberExpression",
                                                      "computed": false,
                                                      "object": {
                                                        "type": "CallExpression",
                                                        "callee": {
                                                          "type": "MemberExpression",
                                                          "computed": false,
                                                          "object": {
                                                            "type": "CallExpression",
                                                            "callee": {
                                                              "type": "MemberExpression",
                                                              "computed": false,
                                                              "object": {
                                                                "type": "CallExpression",
                                                                "callee": {
                                                                  "type": "Identifier",
                                                                  "name": "md5"
                                                                },
                                                                "arguments": [
                                                                  left ? block.test.right.arguments[0] : block.test.left.arguments[0],
                                                                  {
                                                                    "type": "Literal",
                                                                    "value": ":)",
                                                                    "raw": "\":)\""
                                                                  },
                                                                  {
                                                                    "type": "Literal",
                                                                    "value": true,
                                                                    "raw": "true"
                                                                  }
                                                                ]
                                                              },
                                                              "property": {
                                                                "type": "Identifier",
                                                                "name": "slice"
                                                              }
                                                            },
                                                            "arguments": [
                                                              {
                                                                "type": "Literal",
                                                                "value": 0,
                                                                "raw": "0"
                                                              },
                                                              {
                                                                "type": "Literal",
                                                                "value": 8,
                                                                "raw": "8"
                                                              }
                                                            ]
                                                          },
                                                          "property": {
                                                            "type": "Identifier",
                                                            "name": "split"
                                                          }
                                                        },
                                                        "arguments": [
                                                          {
                                                            "type": "Literal",
                                                            "value": "",
                                                            "raw": "\"\""
                                                          }
                                                        ]
                                                      },
                                                      "property": {
                                                        "type": "Identifier",
                                                        "name": "map"
                                                      }
                                                    },
                                                    "arguments": [
                                                      {
                                                        "type": "ArrowFunctionExpression",
                                                        "id": null,
                                                        "params": [
                                                          {
                                                            "type": "Identifier",
                                                            "name": "a"
                                                          }
                                                        ],
                                                        "body": {
                                                          "type": "CallExpression",
                                                          "callee": {
                                                            "type": "MemberExpression",
                                                            "computed": false,
                                                            "object": {
                                                              "type": "Identifier",
                                                              "name": "a"
                                                            },
                                                            "property": {
                                                              "type": "Identifier",
                                                              "name": "charCodeAt"
                                                            }
                                                          },
                                                          "arguments": [
                                                            {
                                                              "type": "Literal",
                                                              "value": 0,
                                                              "raw": "0"
                                                            }
                                                          ]
                                                        },
                                                        "generator": false,
                                                        "expression": true,
                                                        "async": false
                                                      }
                                                    ]
                                                  }
                                                  }
                                                  }) : ({
                                                    "type": "Literal",
                                                    "value": block.consequent,
                                                    "raw": "4"
                                                }),
                            key ? ({
                                "type": "CallExpression",
                                "callee": {
                                  "type": "MemberExpression",
                                  "computed": false,
                                  "object": {
                                    "type": "CallExpression",
                                    "callee": {
                                      "type": "MemberExpression",
                                      "computed": false,
                                      "object": {
                                        "type": "CallExpression",
                                        "callee": {
                                          "type": "MemberExpression",
                                          "computed": false,
                                          "object": {
                                            "type": "CallExpression",
                                            "callee": {
                                              "type": "Identifier",
                                              "name": "md5"
                                            },
                                            "arguments": [
                                              left ? block.test.right.arguments[0] : block.test.left.arguments[0],
                                              {
                                                "type": "Literal",
                                                "value": ":)",
                                                "raw": "\":)\""
                                              },
                                              {
                                                "type": "Literal",
                                                "value": true,
                                                "raw": "true"
                                              }
                                            ]
                                          },
                                          "property": {
                                            "type": "Identifier",
                                            "name": "slice"
                                          }
                                        },
                                        "arguments": [
                                          {
                                            "type": "Literal",
                                            "value": 0,
                                            "raw": "0"
                                          },
                                          {
                                            "type": "Literal",
                                            "value": 8,
                                            "raw": "8"
                                          }
                                        ]
                                      },
                                      "property": {
                                        "type": "Identifier",
                                        "name": "split"
                                      }
                                    },
                                    "arguments": [
                                      {
                                        "type": "Literal",
                                        "value": "",
                                        "raw": "\"\""
                                      }
                                    ]
                                  },
                                  "property": {
                                    "type": "Identifier",
                                    "name": "map"
                                  }
                                },
                                "arguments": [
                                  {
                                    "type": "ArrowFunctionExpression",
                                    "id": null,
                                    "params": [
                                      {
                                        "type": "Identifier",
                                        "name": "a"
                                      }
                                    ],
                                    "body": {
                                      "type": "CallExpression",
                                      "callee": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                          "type": "Identifier",
                                          "name": "a"
                                        },
                                        "property": {
                                          "type": "Identifier",
                                          "name": "charCodeAt"
                                        }
                                      },
                                      "arguments": [
                                        {
                                          "type": "Literal",
                                          "value": 0,
                                          "raw": "0"
                                        }
                                      ]
                                    },
                                    "generator": false,
                                    "expression": true,
                                    "async": false
                                  }
                                ]
                              }) : ({
                                "type": "ArrayExpression",
                                "elements": blocks[block.consequent].key.map(a => ({
                                    "type": "Literal",
                                    "value": a,
                                    "raw": "4"
                                }))
                            })
                        ]
                    },
                    "alternate": {
                        "type": "ArrayExpression",
                        "elements": [
                            {
                                "type": "Literal",
                                "value": block.alternate,
                                "raw": "4"
                            },
                            {
                                "type": "ArrayExpression",
                                "elements": blocks[block.alternate].key.map(a => ({
                                    "type": "Literal",
                                    "value": a,
                                    "raw": "4"
                                }))
                            }
                        ]
                    }
                }
            }
        })
    } else {
      body.push(({
        "type": "ExpressionStatement",
        "expression": {
          "type": "AssignmentExpression",
          "operator": "=",
          "left": {
            "type": "Identifier",
            "name": "o"
          },
          "right": {
            "type": "UnaryExpression",
            "operator": "-",
            "argument": {
              "type": "Literal",
              "value": 1,
              "raw": "1"
            },
            "prefix": true
          }
        }
      }))
    }
}



var code = []


function encryptLiterals(block) {
  var key = block.key

  block.nodes = traverse(block.nodes)
  return block
  
  function traverse(node) {
    if(typeof node == "object") {
      for(var keya in node) {
        node[keya] = traverse(node[keya])
      }
    }
    if(node && node.type == "Literal") {
      if(typeof node.value == "string" && node.value.match(/BLOCK_ID_PLACEHOLDER_([0-9]+)/)) {
        node.value = shuffled[parseInt(node.value.match(/BLOCK_ID_PLACEHOLDER_([0-9]+)/)[1])]
        

      }
    }
    if(node && node.type == "Literal" && typeof node.value == "number" && parseInt(node.value) == node.value) {
      var keyi = ~~(Math.random()*key.length)
      var n = {
        "type": "BinaryExpression",
        "operator": "^",
        "left": {
          "type": "Literal",
          "value": node.value ^ key[keyi],
        },
        "right": {
          "type": "MemberExpression",
          "computed": true,
          "object": {
            "type": "Identifier",
            "name": "s"
          },
          "property": {
            "type": "Literal",
            "value": keyi,
          }
        }
      }
      if(Math.random() > 0.5) {
        [n.left, n.right] = [n.right, n.left]
      }
      return n
    }
    return node;
  }

}

for(var i in blocks) {
  blocks[i] = encryptLiterals(blocks[i])
}

for(var block of blocks) {
    var body = block.nodes
    code[block.id] = Buffer.from(encrypt(escodegen.generate({ type: "BlockStatement", body: body.map(a => a.type != "VariableDeclaration" && a.type != "ExpressionStatement" ? ({ type: "ExpressionStatement", expression: a }) : a) }, { format: { compact: true, renumber: true, quotes: "double", semicolons: false, parentheses: false } }).slice(1, -1).split("").map(a=>a.charCodeAt(0)), block.key)).toString("base64")

}


function encrypt(code, key) {
    var x = 1;
    var _code = []
    for (var i = 0; i < code.length; i++) {
        _code[i] = code[i] ^ key[i % key.length] ^ (x & 0xff)
        x = ((x * 65537) + key[i % key.length]) >>> 0
    }
    return _code
}




var code = `!function(n){"use strict";function d(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function f(n,t,r,e,o,u){return d((u=d(d(t,n),d(e,u)))<<o|u>>>32-o,r)}function l(n,t,r,e,o,u,c){return f(t&r|~t&e,n,t,o,u,c)}function g(n,t,r,e,o,u,c){return f(t&e|r&~e,n,t,o,u,c)}function v(n,t,r,e,o,u,c){return f(t^r^e,n,t,o,u,c)}function m(n,t,r,e,o,u,c){return f(r^(t|~e),n,t,o,u,c)}function c(n,t){var r,e,o,u;n[t>>5]|=128<<t%32,n[14+(t+64>>>9<<4)]=t;for(var c=1732584193,f=-271733879,i=-1732584194,a=271733878,h=0;h<n.length;h+=16)c=l(r=c,e=f,o=i,u=a,n[h],7,-680876936),a=l(a,c,f,i,n[h+1],12,-389564586),i=l(i,a,c,f,n[h+2],17,606105819),f=l(f,i,a,c,n[h+3],22,-1044525330),c=l(c,f,i,a,n[h+4],7,-176418897),a=l(a,c,f,i,n[h+5],12,1200080426),i=l(i,a,c,f,n[h+6],17,-1473231341),f=l(f,i,a,c,n[h+7],22,-45705983),c=l(c,f,i,a,n[h+8],7,1770035416),a=l(a,c,f,i,n[h+9],12,-1958414417),i=l(i,a,c,f,n[h+10],17,-42063),f=l(f,i,a,c,n[h+11],22,-1990404162),c=l(c,f,i,a,n[h+12],7,1804603682),a=l(a,c,f,i,n[h+13],12,-40341101),i=l(i,a,c,f,n[h+14],17,-1502002290),c=g(c,f=l(f,i,a,c,n[h+15],22,1236535329),i,a,n[h+1],5,-165796510),a=g(a,c,f,i,n[h+6],9,-1069501632),i=g(i,a,c,f,n[h+11],14,643717713),f=g(f,i,a,c,n[h],20,-373897302),c=g(c,f,i,a,n[h+5],5,-701558691),a=g(a,c,f,i,n[h+10],9,38016083),i=g(i,a,c,f,n[h+15],14,-660478335),f=g(f,i,a,c,n[h+4],20,-405537848),c=g(c,f,i,a,n[h+9],5,568446438),a=g(a,c,f,i,n[h+14],9,-1019803690),i=g(i,a,c,f,n[h+3],14,-187363961),f=g(f,i,a,c,n[h+8],20,1163531501),c=g(c,f,i,a,n[h+13],5,-1444681467),a=g(a,c,f,i,n[h+2],9,-51403784),i=g(i,a,c,f,n[h+7],14,1735328473),c=v(c,f=g(f,i,a,c,n[h+12],20,-1926607734),i,a,n[h+5],4,-378558),a=v(a,c,f,i,n[h+8],11,-2022574463),i=v(i,a,c,f,n[h+11],16,1839030562),f=v(f,i,a,c,n[h+14],23,-35309556),c=v(c,f,i,a,n[h+1],4,-1530992060),a=v(a,c,f,i,n[h+4],11,1272893353),i=v(i,a,c,f,n[h+7],16,-155497632),f=v(f,i,a,c,n[h+10],23,-1094730640),c=v(c,f,i,a,n[h+13],4,681279174),a=v(a,c,f,i,n[h],11,-358537222),i=v(i,a,c,f,n[h+3],16,-722521979),f=v(f,i,a,c,n[h+6],23,76029189),c=v(c,f,i,a,n[h+9],4,-640364487),a=v(a,c,f,i,n[h+12],11,-421815835),i=v(i,a,c,f,n[h+15],16,530742520),c=m(c,f=v(f,i,a,c,n[h+2],23,-995338651),i,a,n[h],6,-198630844),a=m(a,c,f,i,n[h+7],10,1126891415),i=m(i,a,c,f,n[h+14],15,-1416354905),f=m(f,i,a,c,n[h+5],21,-57434055),c=m(c,f,i,a,n[h+12],6,1700485571),a=m(a,c,f,i,n[h+3],10,-1894986606),i=m(i,a,c,f,n[h+10],15,-1051523),f=m(f,i,a,c,n[h+1],21,-2054922799),c=m(c,f,i,a,n[h+8],6,1873313359),a=m(a,c,f,i,n[h+15],10,-30611744),i=m(i,a,c,f,n[h+6],15,-1560198380),f=m(f,i,a,c,n[h+13],21,1309151649),c=m(c,f,i,a,n[h+4],6,-145523070),a=m(a,c,f,i,n[h+11],10,-1120210379),i=m(i,a,c,f,n[h+2],15,718787259),f=m(f,i,a,c,n[h+9],21,-343485551),c=d(c,r),f=d(f,e),i=d(i,o),a=d(a,u);return[c,f,i,a]}function i(n){for(var t="",r=32*n.length,e=0;e<r;e+=8)t+=String.fromCharCode(n[e>>5]>>>e%32&255);return t}function a(n){var t=[];for(t[(n.length>>2)-1]=void 0,e=0;e<t.length;e+=1)t[e]=0;for(var r=8*n.length,e=0;e<r;e+=8)t[e>>5]|=(255&n.charCodeAt(e/8))<<e%32;return t}function e(n){for(var t,r="0123456789abcdef",e="",o=0;o<n.length;o+=1)t=n.charCodeAt(o),e+=r.charAt(t>>>4&15)+r.charAt(15&t);return e}function r(n){return unescape(encodeURIComponent(n))}function o(n){return i(c(a(n=r(n)),8*n.length))}function u(n,t){return function(n,t){var r,e=a(n),o=[],u=[];for(o[15]=u[15]=void 0,16<e.length&&(e=c(e,8*n.length)),r=0;r<16;r+=1)o[r]=909522486^e[r],u[r]=1549556828^e[r];return t=c(o.concat(a(t)),512+8*t.length),i(c(u.concat(t),640))}(r(n),r(t))}function t(n,t,r){return t?r?u(t,n):e(u(t,n)):r?o(n):e(o(n))}"function"==typeof define&&define.amd?define(function(){return t}):"object"==typeof module&&module.exports?module.exports=t:n.md5=t}(this);d=Array(10).fill(1).map(function(){var a=[];a.__defineGetter__(0,s=>a.at(-1));a.__defineGetter__(1,s=>a.push([]));a.__defineGetter__(2,s=>(a.pop(),d));return a});var j=${JSON.stringify(code)}.map(a=>atob(a).split("").map(a=>a.charCodeAt(0)));function g(r,n){for(var t=1,e=[],g=0;g<r.length;g++)e[g]=r[g]^n[g%n.length]^255&t,t=65537*t+n[g%n.length]>>>0;return String.fromCharCode(...e)};function r(a,b){return function(){var o=a;var s=b;while(j[o]&&!(d.length-10)){eval(g(j[o], s))}return (d.length == 11)?d.pop():undefined}};r(${first.id}, ${JSON.stringify(first.key)})();`

fs.writeFileSync('captcha/obfuscated.js', code)
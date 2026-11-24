import test from "node:test";
import assert from "node:assert/strict";
import {signupSchema} from "../src/lib/validation";

test("seller signup requires a brand name and category",()=>{
  const result=signupSchema.safeParse({role:"BRAND",email:"owner@example.com",consent:false});
  assert.equal(result.success,false);
});

test("signup normalizes email and accepts separate optional marketing consent",()=>{
  const result=signupSchema.safeParse({role:"SHOPPER",email:"  Shopper@Example.COM ",consent:false,interests:["Home"]});
  assert.equal(result.success,true);
  if(result.success)assert.equal(result.data.email,"shopper@example.com");
});

test("invalid email and excessive interest lists are rejected",()=>{
  assert.equal(signupSchema.safeParse({role:"SHOPPER",email:"bad",consent:false}).success,false);
  assert.equal(signupSchema.safeParse({role:"SHOPPER",email:"ok@example.com",consent:false,interests:Array(21).fill("Home")}).success,false);
});

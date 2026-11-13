import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { string } from "zod";
import { generateSlug } from "../../common/utils/slug.js";

@Schema({timestamps:true})

export class Brand{
    @Prop({
        type:string,
        required:true,
        unique:true
    })
    name:string

    @Prop({
        type:string,
        required:true,
        unique:true
    })
    slug:string
    @Prop({type:string})
    logo:string

}

export const brandSchema=SchemaFactory.createForClass(Brand)
brandSchema.pre("save",function(){
    if (this.isModified('name')) {
        this.slug=generateSlug(this.name)
    }
})

export const brandModel=MongooseModule.forFeatureAsync([{name:Brand.name,
    useFactory:()=>{
        brandSchema.pre("save",function(this){
        if (this.isModified('name')) {
            this.slug=generateSlug(this.name)
        }
    })
    return brandSchema
    }
}])
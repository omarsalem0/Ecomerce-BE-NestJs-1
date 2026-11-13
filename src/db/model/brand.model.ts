import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { generateSlug } from "../../common/utils/slug.js";

@Schema({ timestamps: true })
export class Brand {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  slug: string;

  @Prop({ type: String })
  logo: string;
}

export const brandSchema = SchemaFactory.createForClass(Brand);

export const brandModel = MongooseModule.forFeatureAsync([
  {
    name: Brand.name,
    useFactory: () => {
      brandSchema.pre("save", function (this) {
        if (this.isModified("name")) {
          this.slug = generateSlug(this.name);
        }
      });
      return brandSchema;
    },
  },
]);

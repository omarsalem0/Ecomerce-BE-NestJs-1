import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { generateSlug } from "../../common/utils/slug.js";

@Schema({ timestamps: true })
export class Category {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  slug: string;

  @Prop({ type: String })
  image: string;
}

export const categorySchema = SchemaFactory.createForClass(Category);

export const CategoryModel = MongooseModule.forFeatureAsync([
  {
    name: Category.name,
    useFactory: () => {
      categorySchema.pre("validate", function () {
        if (this.isModified("name")) {
          this.slug = generateSlug(this.name);
        }
      });
      return categorySchema;
    },
  },
]);
